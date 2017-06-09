/**
 * Created by huijuan on 15/8/31.
 */
//截取特定action用于统计分析
export default function AnalysisAfterMiddleware(store) {
    return next =>
        action => {
            if (!window.iTalentPMS) return next(action);

            var type = action.type || "";
            var isAjax = false;

            if (action.payload && action.payload === "Injection") {
                var last = type.indexOf("_") != -1
                    ? type.match(/.*_/)[0].lastIndexOf("_")
                    : "";
                type = last ? type.slice(0, last) : type;
                window.iTalentPMS.addAjax &&
                    window.iTalentPMS.addAjax(type, "end");
                isAjax = true;
            }
            window.iTalentPMS.setCurrent &&
                window.iTalentPMS.setCurrent("Action", {
                    type: type,
                    isAjax: isAjax
                });
            return next(action);
        };
}
