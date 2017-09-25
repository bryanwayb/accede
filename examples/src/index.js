const accede = require('../../index.js');

window.addEventListener('load', () => {
    async function main() {
        class TestingComponent extends accede.ui.Component {
            constructor() {
                super((data) => `<div id="container" onclick="this.test(event)">Testing Component<br /></div>The time is <span id="time"></span><br />${data.text}`, {
                    events: ['click']
                });
            }

            onComponentReady() {
                this.nodes.time.innerText = new Date().toISOString();
            }

            test(event) {
                console.log(this.nodes.container);
            }

            onDetaching() {
                console.log('Sub component detached');
            }
        }

        class AnotherTestingComponent extends accede.ui.Component {
            constructor() {
                super(() => 'An example with HTML components<div><testing-component id="testing" text="This is attribute text" /></div>');
            }

            onComponentReady() {
                setTimeout(() => {
                    this.nodes.testing.setAttribute('text', 'This is updated attribute text')
                }, 1000);
            }

            onDetaching() {
                console.log('Top component detached');
            }
        }

        accede.ui.Component.register('testing-component', TestingComponent, {
            attributes: ['text']
        });
        
        let instance = new AnotherTestingComponent();
        
        console.time('render');
        instance.attach(window.document.body).render();
        console.timeEnd('render');
    }
    
    main();
});