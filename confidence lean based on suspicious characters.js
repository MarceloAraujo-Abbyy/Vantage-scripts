// calculate confidence level based on suspiciuos characters
// this scripts only send to log the results, however you can modify to save it on a field. 

var trans_count_docs = 0;
var trans_sum_conf = 0;
for (var doc of Context.Transaction.Documents) {
    var data = doc.Exports.GetByFormat(ExportFormat.Json).ToJson().toString();
    var obj = JSON.parse(data);
    var fields = obj["Transaction"]["Documents"][0]["ExtractedData"]["RootObject"]["Fields"];
    var count_fields = 0;
    var doc_sum_conf = 0;
    for (var field of fields) {
        Context.LogMessage("field: " + field.Name);
        let conf = 0;
        var fvalue =  field.List[0].Value;
        if (typeof(fvalue)=="object") {
            for (var sfield of fvalue.Fields) {
                let annot = sfield["List"][0]["Annotations"]; 
                if (annot && annot[0]["SuspiciousSymbols"]) {
                    if (annot[0]["SuspiciousSymbols"].length == 0) {
                        conf = 1;
                    } else {
                        conf = 1 - (annot[0]["SuspiciousSymbols"].length / annot[0]["RawValue"].length);
                    }
                    count_fields++;
                    doc_sum_conf += conf;
                    Context.LogMessage("Field " + field.Name + " Confidence: " + conf);
                }
            }
        } 
        else {
            let annot = field["List"][0]["Annotations"];    
            if (annot && annot[0]["SuspiciousSymbols"]) {
                if (annot[0]["SuspiciousSymbols"].length == 0) {
                    conf = 1;
                } else {
                    conf = 1 - (annot[0]["SuspiciousSymbols"].length / annot[0]["RawValue"].length);
                }
                count_fields++;
                doc_sum_conf += conf;
                Context.LogMessage("Field " + field.Name + " Confidence: " + conf);
            }
        }
    }
    let doc_conf = doc_sum_conf/count_fields;
    Context.LogMessage("Doc " + doc.DocumentId + " Confidence: " + doc_conf);

    trans_count_docs++;
    trans_sum_conf+=doc_conf;

}
let trans_conf = trans_sum_conf/trans_count_docs;
Context.LogMessage("Transaction " + Context.Transaction.Id + " Confidence: " + trans_conf);
    
