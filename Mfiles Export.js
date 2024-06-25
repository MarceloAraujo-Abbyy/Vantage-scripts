// this script export Invoices to Mfiles
// for another document types needs adjustments the fields

function getToken() {
 
    // parameters create on Vantage Configuration panel
    var username = Context.GetSecret("mfiles_usr");
    var password = Context.GetSecret("mfiles_pwd"); 
    var vault = Context.GetSecret("mfiles_vault");  
    // create request body
    var requeast_data = [];
    requeast_data = { "Username": username, "Password": password,  "VaultGuid": vault } ;
    var body = JSON.stringify(requeast_data);
    // create request
    var url_token = "https://xxxxxxxxxxxxx.cloudvault.m-files.com/rest/server/authenticationtokens"
    var httpRequest1_token = Context.CreateHttpRequest();
    httpRequest1_token.Method = "POST";
    httpRequest1_token.Url = url_token;
    httpRequest1_token.SetHeader("Content-Type", "application/json");
    httpRequest1_token.SetStringContent(body);
    httpRequest1_token.Send();
    // Get response result of json deserialization as object
    Context.LogMessage(" Token Response: " + httpRequest1_token.ResponseText);
    return httpRequest1_token.ResponseText;
}
 
function uploadFile(token) {
 
    // get file considering 1 file per transaction
    var exports = Context.Transaction.Documents[0].Exports;
    var pdfExportResult = exports.find(element => element.ExportFormat === ExportFormat.Pdf);
 
    // create request
    var url_upload = "https://xxxxxxxxxxxxxxx.cloudvault.m-files.com/rest/files"
    var httpRequest1_upload = Context.CreateHttpRequest();
    httpRequest1_upload.Method = "POST";
    httpRequest1_upload.Url = url_upload;
    httpRequest1_upload.SetHeader("Content-Type", "application/json");
    httpRequest1_upload.SetHeader("X-Authentication", token);
    httpRequest1_upload.SetFileContent(pdfExportResult);
    httpRequest1_upload.Send();
    // Get result
    Context.LogMessage(" Upload Response: " + httpRequest1_upload.ResponseText;);
    return httpRequest1_upload.ResponseText;;
}
 
function createDocument(token,upload_id,upload_size) {
 
    // parameters create on Vantage Configuration panel
    var username = Context.GetSecret("mfiles_usr");
    var password = Context.GetSecret("mfiles_pwd"); 
    var vault = Context.GetSecret("mfiles_vault");  
    // create request body
    var body = createData(upload_id,upload_size);
    // create request
    var url_document = "https://xxxxxxxxxxxx.cloudvault.m-files.com/rest/objects/0?checkIn=true"
    var httpRequest1_doc = Context.CreateHttpRequest();
    httpRequest1_doc.Method = "POST";
    httpRequest1_doc.Url = url_document;
    httpRequest1_doc.SetHeader("Content-Type", "application/json");
    httpRequest1_doc.SetHeader("X-Authentication", token);
    httpRequest1_doc.SetStringContent(body);
    httpRequest1_doc.Send();
    // Get response result of json deserialization as object
    var ret = httpRequest1_doc.ResponseText;
    Context.LogMessage(" Doc Response: " + ret)
}
 
function createData (id, size) {
    var data = [];
    var propertyValues = [];
    var propertyValue = [];
    var typedValue = [];
    var lookup = [];
    var files = [];
    var file = [];
 
    typedValue = {"DataType": 1, "Value": "doc1"};
    propertyValue =  { "PropertyDef": 0,  "TypedValue": typedValue };
    propertyValues.push(propertyValue);
 
    typedValue = {"DataType": 8, "Value": true};
    propertyValue =  { "PropertyDef": 22,  "TypedValue": typedValue };
    propertyValues.push(propertyValue);
 
    // invoice number
    var invoice_number = Context.Transaction.Documents[0].GetField("Invoice Number").Value;
    typedValue = {"DataType": 1, "Value": invoice_number};
    propertyValue =  { "PropertyDef": 1193,  "TypedValue": typedValue };
    propertyValues.push(propertyValue);
 
    // invoice date
    var invoice_date = Context.Transaction.Documents[0].GetField("Invoice Date").Value;
    typedValue = {"DataType": 5, "Value": invoice_date};
    propertyValue =  { "PropertyDef": 1194,  "TypedValue": typedValue };
    propertyValues.push(propertyValue);
 
    // invoice value
    var invoice_value = Context.Transaction.Documents[0].GetField("Total").Value;
    typedValue = {"DataType": 3, "Value": invoice_value};
    propertyValue =  { "PropertyDef": 1195,  "TypedValue": typedValue };
    propertyValues.push(propertyValue);
 
    lookup = {"Item": 17, "Version": -1}
    typedValue = {"DataType": 9, "Lookup": lookup };
    propertyValue =  { "PropertyDef": 100,  "TypedValue": typedValue };
    propertyValues.push(propertyValue);
 
    // files
    var filename = Context.Transaction.Documents[0].SourceFiles[0].FileName;
    file =  { "UploadID": id, "Size": size, "Title": filename, "Extension": "pdf"};
    files.push(file);
 
    // body complete
    data = {"PropertyValues": propertyValues, "Files": files }
 
    Context.LogMessage(JSON.stringify(data));
    return JSON.stringify(data);
}
 
// get token
var ret_token = JSON.parse(getToken())
var token = ret_token['Value'];
 
// upload file
var ret_upload = JSON.parse(uploadFile(token));
var upload_id = ret_upload.UploadID;
var upload_size = ret_upload.Size;
 
// create Document
var document = createDocument(token,upload_id,upload_size);
