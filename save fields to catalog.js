\\ sometimes we need save the fields in a temporary repository to reassembly the documents in one transaction
\\ this script is to SAVE into catalog to be read after 
\\ needs a catalog with the following columns: transaction_id, document_id, field_id, field_name, field_value


var docs = Context.Transaction.Documents;
var token = getToken();
var catalogId = "temp_rep";

//creating csv file
var count = 0; 
for (var doc of docs) {
    save_catalog(doc, count);
    count ++;
}

// creating lines from each document 
function save_catalog(doc, doc_count) {
    var part_count = 0; 
    for (var field of doc.Fields) {
        var parts = splitString(field.Value);
        for (var part of parts) {
            var unique_id = Context.Transaction.Id + "_"+ doc_count + "_" + doc.DocumentId + "_"+ part_count;
            var obj = [{"id": unique_id, "fields": { "transaction_id": [Context.Transaction.Id], 
                                                    "document_id": [doc.DocumentId],
                                                    "field_id": [field.Id],
                                                    "field_name": [field.Name],
                                                    "field_value": [field.Value]}}]
            var json_data = JSON.stringify(obj)
            saveCatalog(json_data);
            part_count ++
        }
    }
}

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


function saveCatalog(data) {

    // create url request to save data into catalog
    var url = "https://vantage-us.abbyy.com/api/publicapi/v1/catalogs/"+catalogId+"/records"
    //Create http request with multipart form data
    var httpRequest1 = Context.CreateHttpRequest();
    httpRequest1.Method = "POST";
    httpRequest1.Url = url;
    httpRequest1.SetHeader("accept", "text/plain");
    httpRequest1.SetHeader("Authorization", token);
    httpRequest1.SetHeader("Content-Type", "application/json-patch+json");
    httpRequest1.SetStringContent(data);
    httpRequest1.Send();
    return;

}


function splitString(str) {
    var max = 250;
    let ret = [];
    for (let i = 0; i < str.length; i += max) {
        ret.push(str.slice(i, i + max));
    }
    return ret;
}







