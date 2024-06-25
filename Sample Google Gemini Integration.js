// this script show how integrate with Google Gemini 
// needs Google API key 
// this sample send the full ocr and ask for translate
// you can modify the prompt as you need


for (var doc of Context.Transaction.Documents) {
    extract_resume_gemini(doc)
}

function extract_resume_gemini( doc) {
    
    var fullocr = doc.GetField("fullOCR").Value;
    var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + Context.GetSecret("google_gemini_api_key");
    var prompt = 'Translate the folowing text to English. Please provide only the translated text as response.';
    var data = JSON.stringify({ "contents": [ {"parts": [ { "text": ""+prompt+""},{"text": ""+fullocr+"" }]}]});
    
    Context.LogMessage("Prompt Translate: " + data);
    
    var httpRequest = Context.CreateHttpRequest();
    httpRequest.Method = "POST";
    httpRequest.Url = url;
    httpRequest.SetHeader("Content-Type", "application/json");
    httpRequest.SetStringContent(data);
    httpRequest.Send();

    var json = httpRequest.ResponseText;
    Context.LogMessage("Response Translate: " + json);
    
    var ret = JSON.parse(json);
    var obj = ret['candidates'][0]['content']['parts'][0]['text'];

    doc.GetField("fullOCR_English").Value = obj;
    
}
