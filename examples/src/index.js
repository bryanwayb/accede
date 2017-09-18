const accede = require('../../index.js');

window.addEventListener('load', () => {
    async function main() {
        class TestingComponent extends accede.ui.Component {
            constructor() {
                super('<div id="container" onclick="this.test(event)">Testing Component<br /></div>The time is <span id="time"></span>', {
                    events: ['click']
                });
            }

            onComponentReady() {
                this.ids.time.innerText = new Date().toISOString();
            }

            test(event) {
                console.log(this.ids.container);
            }
        }

        class AnotherTestingComponent extends accede.ui.Component {
            constructor() {
                super(() => 'An example with HTML components<TestingComponent />');
            }
        }

        accede.ui.Component.register(TestingComponent);
        
        let instance = new AnotherTestingComponent();
        
        instance.attach(window.document.body).render();
    }
    
    main();
});