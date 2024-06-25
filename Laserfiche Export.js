// export documents to laserfiche repository 

// parameters 
var lf_secret = Context.GetSecret("laserfiche_secret");             // Laserfiche secret used to get accesstoken 
var lf_repository = Context.GetSecret("laserfiche_repository");     // Laserfiche repository id
var lf_export_field = "Laserfiche Export"                           // Field to save export's sucess / error 
var lf_template_name = "Invoices";                                  // Template name (document type)
var lf_fields_mapping = {   "Vendor/Name" : "Vendor Name",          // Mapping Vantage and Laserfiche regular Fields 
                            "Vendor/ID" : "Vendor ID",              // Vantage Field : Laserfiche Field
                            "Vendor/Address" : "Address",
                            "Vendor/State" : "State",
                            "Vendor/City" : "City",
                            "Vendor/Zip Code" : "Zip Code",
                            "Invoice Number": "Invoice Number", 
                            "Invoice Date": "Date of Invoice", 
                            "Purchase Order/Order Number": "Purchase Order",
                            "Total": "Total Amount",
                            "Invoice Status": "Invoice Status"
                        }
var lf_li_fields_mapping = {"Line Items/Description": "Part Number/Description",    // Mapping Vantage and Laserfiche table Fields 
                            "Line Items/Quantity" : "Quantity",                     // Vantage Field : Laserfiche Field
                            "Line Items/Unit Price" : "Unit Price",
                            "Line Items/Net Price": "Total"
                            }

// get access token
var lf_access_token = get_token()
Context.LogMessage(" Token -> " + lf_access_token);

// process all transacion docs
for (var doc of Context.Transaction.Documents) {
    upload_doc(doc); 
    
}

// call laserfiche API to upload document
function upload_doc(doc) {

    var request_data = create_doc_data(doc); //create metadata info
    var file = doc.Exports.GetByFormat(ExportFormat.Pdf);  // get PDF file 

    try {
        var http_request =  Context.CreateMultipartFormDataRequest();
        http_request.Method = "POST";
        http_request.Url = "https://api.laserfiche.com/repository/v2/Repositories/"+lf_repository+"/Entries/1/Folder/Import";
        http_request.SetHeader("Authorization", lf_access_token);
        http_request.AppendStringContent(request_data, "request")
        http_request.AppendFileContent(file, "File");
        http_request.Send();
        var obj = JSON.parse(http_request.ResponseText)
        var new_doc_id = obj['id'];
        doc.GetField(lf_export_field).Value = "SUCCESS. Document ID " + new_doc_id;
        return new_doc_id;
    } catch(err) {
        doc.GetField(lf_export_field).Value = "ERROR. " + err.message;
    }
}

// create laserfiche document metadata info
function create_doc_data(doc) {
    
    const pdfOptions = {
        generatePages: true,
        generatePagesImageType: "StandardColor",
        keepPdfAfterImport: true
    };
    const fields = [];
    for (var field of doc.Fields) {
        
        //for group fields
        if (field.Children.length > 0 ) {  
            for (var child of field.Children ) {
                Context.LogMessage(child.FullName + ": " + child.Value);
                if (child.FullName in lf_fields_mapping) {
                    if (child.DataType==2) { //DataType=Date
                        var date_value = child.value.toISOString().substring(0,10);
                        fields.push(createField(lf_fields_mapping[child.FullName],date_value));
                    }
                    else {
                        fields.push(createField(lf_fields_mapping[child.FullName],child.Value));
                    }
                }
            } 
        }  
        // for normal fields 
        if (field.FullName in lf_fields_mapping) {
            if (field.DataType==2) { //DataType=Date
                var date_value = field.value.toISOString().substring(0,10)
                fields.push(createField(lf_fields_mapping[field.FullName],date_value))
            }
            else {
                fields.push(createField(lf_fields_mapping[field.FullName],field.Value))
            }
        } 
        //for table fields       
        if (field.FullName == "Line Items") {     
            if (field.Instances.length > 0 ) { 
                var values = []
                    for (var instance of field.Instances) {
                        for (var column of instance.Children) { 
                            if (column.FullName in lf_li_fields_mapping) { 
                                var new_value = { field: column.FullName, value: column.Value}
                                values.push(new_value);
                            }
                        }
                }
                for (var li in lf_li_fields_mapping){
                    var lf_values = []; 
                    for (var i = 0; i < values.length; i++) {
                        if (li == values[i].field) {
                            lf_values.push( values[i].value )
                        }
                    }
                    var lf_field_name = getValueIfExists(li,lf_li_fields_mapping);  
                    fields.push(createMultipleField(lf_field_name,lf_values))
                }
                
            }

        }

    }
    const metadata = { 
        templateName: lf_template_name, 
        fields: fields, 
        tags: [] //["Imported from ABBYY"] 
    }
    const documentData = {
        name: doc.SourceFiles[0].FileName,
        autoRename: true,
        pdfOptions: pdfOptions,
        metadata: metadata
    };
    Context.LogMessage("documentData -> " + JSON.stringify(documentData))
    return JSON.stringify(documentData);

}

// call laserfiche API to get access token
function get_token() {
   
    var authDataContent = {};
    authDataContent.grant_type = "client_credentials";
    authDataContent.scope = "repository.Read repository.Write";

    var http_request =  Context.CreateHttpRequest();
    http_request.Method = "POST";
    http_request.Url =  "https://signin.laserfiche.com/oauth/token";
    http_request.SetHeader("Content-Type", "application/x-www-form-urlencoded");
    http_request.SetHeader("Authorization", "Bearer " + lf_secret);
    http_request.SetUrlFormEncodedContent(authDataContent)
    http_request.Send();
    var obj = JSON.parse(http_request.ResponseText)
    var token = "Bearer " + obj['access_token'];
    return token;

}

function createField(name, value) {
  var values = [];  
  values.push(value);
  return { name: name, values: values };
}
function createMultipleField(name, values) {
  return { name: name, values: values };
}
function getValueIfExists(key, obj) {
    if (key in obj) { return obj[key] } else {  return null; }
}

