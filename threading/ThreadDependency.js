'use strict';

if(!process.env.ACCEDE_DISABLE_THREAD) {
    const whiteSpaceRegex = /\s/;

    class ThreadDependency {
        constructor(name, obj, dependencies = null) {
            if(typeof name !== 'string' || !name || whiteSpaceRegex.test(name)) {
                throw new Error(`Invalid dependency name passed: ${name}`);
            }

            if(dependencies == null) {
                dependencies = [];
            }
            else if(!Array.isArray(dependencies)) {
                dependencies = [dependencies];
            }

            ThreadDependency.verifyDependencies(dependencies);

            this.name = name;
            this.obj = obj;
            this.dependencies = dependencies;
        }

        static verifyDependencies(dependencies) {
            for(let i = 0; i < dependencies.length; i++) {
                if(!(dependencies[i] instanceof ThreadDependency)) {
                    throw new Error('Invalid dependency object found; must be instance of ThreadDependency');
                }
            }
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