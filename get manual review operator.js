// sometimes we need get the user name responsable for execute the Manaul Review Task.
// This scripts get run the reporting API and get the user name
// you can save it on a field or just show in the log

Context.LogMessage("Custom Activity");

// Get report Data
var skillid = "INCLUDE YOUR PROCESS SKILL ID"
var token = getToken();
var start = new Date(Date.now() - ( 3600 * 1000 * 24));
var startDate = start.toISOString();
var end = new Date(Date.now() + ( 3600 * 1000 * 24));
var endDate = end.toISOString();
var url = 'https://vantage-us.abbyy.com/api/reporting/v1/transaction-steps?skillid='+skillid+'&startDate='+startDate+'&endDate='+endDate;

var httpRequest = Context.CreateHttpRequest();
httpRequest.Url = url;
httpRequest.Method = "GET";
httpRequest.SetHeader('accept','*/*')
httpRequest.SetHeader('Authorization', token)
httpRequest.Send();
Context.LogMessage(httpRequest.ResponseText);

// get MR User from report date
var ret = httpRequest.ResponseText;
var trans = Context.Transaction.Id;
var fxstr = trans + ',Review,ManualReview,';
var pos = ret.indexOf(fxstr)
var str = ret.substring(pos + fxstr.length, ret.length);
var user = str.split(',')[0];

// show in the log 
Context.LogMessage('Manual Review User: ' + user );

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
