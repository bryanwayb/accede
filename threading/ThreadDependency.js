'use strict';

if(!process.env.ACCEDE_DISABLE_THREAD) {
    class ThreadDependency {
        constructor(name, obj, dependencies = null) {
            // TODO: Verify name here

            if(dependencies == null) {
                dependencies = [];
            }
            else if(!Array.isArray(dependencies)) {
                dependencies = [dependencies];
            }

            // TODO: Verify dependencies here

            this.name = name;
            this.obj = obj;
            this.dependencies = dependencies;
        }

        createScript() {
            let scriptObj;
            
            if(typeof this.obj === 'function') {
                scriptObj = this.obj.toString();
            }
            else {
                scriptObj = JSON.stringify(this.obj);
            }

            let scriptDependencies  = this.dependencies.map((v) => {
                return v.createScript();
            });

            let script = `let ${this.name} = (() => { ${scriptDependencies.join()} return (${scriptObj}) })();\n`;



            return script;
        }
    }
    module.exports = ThreadDependency;
}
else {
    module.exports = null;
}