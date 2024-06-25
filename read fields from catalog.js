// after save the fields on the catalog using save fields script, this script read the fields. 
// in this specific sample, there is a assemble activity to group all documents in one document, and the fields area saved is CSV format in one field
// needs a catalog with thre format transaction_id, document_id, field_id, field_name, field_value


var token = getToken();
var catalog = "temp_rep";
var output_field = "output_data_field";
var transaction_id = Context.Transaction.Id; 
var separator = ";";
var newline = "\n";
var csv_output = "";

var json = getCatalog(); // get complete catalog
var data = JSON.parse(json);
var records = data.sort((a, b) => a.id.localeCompare(b.id)); //order by id = transaction_document_count

var to_remove = [];
var csv_line = "";
var actual_doc = "";

if (csv_output == "") {csv_output = create_header_csv(records)} // if first record create header 

for (var record of records) {
    if ( record['id'].split("_")[0] == transaction_id) { //if same transaction create csv
        if (actual_doc == "") {actual_doc = record['id'].split("_")[2]}; // get fist doc
       // next Documents
        if (record['id'].split("_")[2] != actual_doc) {
            actual_doc = record['id'].split("_")[2];
            csv_output += csv_line + newline;
            csv_line = "";
        }

        var fields = record['fields'];
        for (const field in fields) {
            if (Object.hasOwnProperty.call(fields, field)) {
                if (field == "field_value") { // salve only the value on csv 
                    const val = fields[field];
                    csv_line += val[0]+ separator;
                }
            }
        }
        // save id to be removed.
        to_remove.push(record['id'])
    }
}

csv_output += csv_line + newline;
removeCatalog(to_remove)
Context.Transaction.Documents[0].GetField(output_data_field).Value = csv_output;


function getToken() {

    // create url request to save data into catalog
    var tenant = Context.GetSecret("tenant");
    var url_token = "https://vantage-us.abbyy.com/auth2/"+tenant+"/connect/token"
    var authDataContent = {};
    authDataContent.grant_type = "password";
    authDataContent.scope = "openid permissions global.wildcard";
    authDataContent.client_id = Context.GetSecret("client_id");
    authDataContent.client_secret = Context.GetSecret("client_secret");
    authDataContent.password = Context.GetSecret("password");
    authDataContent.username = Context.GetSecret("username");


    //Create http request with multipart form data
    var httpRequest1_token = Context.CreateHttpRequest();
    httpRequest1_token.Method = "POST";
    httpRequest1_token.Url = url_token;
    httpRequest1_token.SetHeader("accept", "*/*");
    httpRequest1_token.SetHeader("Content-Type", "application/x-www-form-urlencoded");
    httpRequest1_token.SetUrlFormEncodedContent(authDataContent);
    httpRequest1_token.Send();

    // Get response result of json deserialization as object
    var obj_auth = JSON.parse(httpRequest1_token.ResponseText)
    var token = "Bearer " + obj_auth['access_token'];

    Context.LogMessage(" Token Response: " + token);
    
    return token
} 


function getCatalog() {

    // create url request to save data into catalog
    var url = "https://vantage-us.abbyy.com/api/publicapi/v1/catalogs/"+catalog+"/records?offset=1&limit=1000"

    //Create http request with multipart form data
    var httpRequest1 = Context.CreateHttpRequest();
    httpRequest1.Method = "GET";
    httpRequest1.Url = url;
    httpRequest1.SetHeader("accept", "text/plain");
    httpRequest1.SetHeader("Authorization", token);
    httpRequest1.SetHeader("Content-Type", "application/json-patch+json");
    httpRequest1.Send();

    var ret = httpRequest1.ResponseText;

    // Get response result of json deserialization as object
    Context.LogMessage("Response get catalog: " + ret);

    return ret 

}

function removeCatalog(to_remove) {

    // create url request to save data into catalog
    var url = "https://vantage-us.abbyy.com/api/publicapi/v1/catalogs/"+catalog+"/records/delete"
    var data = JSON.stringify(to_remove)

    //Create http request with multipart form data
    var httpRequest1 = Context.CreateHttpRequest();
    httpRequest1.Method = "POST";
    httpRequest1.Url = url;
    httpRequest1.SetHeader("accept", "text/plain");
    httpRequest1.SetHeader("Authorization", token);
    httpRequest1.SetHeader("Content-Type", "application/json-patch+json");
    httpRequest1.SetStringContent(data)
    httpRequest1.Send();

    // Get response result of json deserialization as object
    var ret = httpRequest1.ResponseText;
    Context.LogMessage("content remove catalog: " + data);
    Context.LogMessage("Response remove catalog: " + ret);
    
    return ret 

}

function create_header_csv(records) {

    var csv_header = "";
    for (var record of records) {
        if ( record['id'].split("_")[0] == transaction_id) { //if same transaction create csv
            var fields = record['fields'];
            for (const field in fields) {
                if (Object.hasOwnProperty.call(fields, field)) {
                    if (field == "field_name") { // salve only the value on csv 
                        const val = fields[field];
                        if (csv_header.indexOf(val[0]) == -1 ) { // if there is no this field on the reader
                            csv_header += val[0] + separator;
                        }
                    }
                }
            }
        }
    }
    Context.LogMessage("csv_header: " + csv_header);
    return csv_header + newline;
}
