/** @jsx dom */

import trigger from 'trigger-event'
import Emitter from 'component-emitter'
import raf from 'component-raf'
import assert from 'assert'
import dom from 'virtual-element'
import {render,remove,view} from '../../'
import {HelloWorld,Span,TwoWords,mount,div} from '../helpers'
import memoize from 'memoizee'

it('should render and remove an element', function(){
  var el = div()
  render(el, <span>Hello World</span>)
  assert.equal(el.innerHTML, '<span>Hello World</span>')
  remove(el)
  assert.equal(el.innerHTML, '')
})

it('should replace a mounted element', function(){
  var el = div()
  var mount = render(el)
  mount(<span>Hello World</span>)
  mount(<div>Foo!</div>)
  assert.equal(el.innerHTML, '<div>Foo!</div>')
  remove(el)
  assert.equal(el.innerHTML, '')
})

it.only('should remove the mounted element when unmounted', function(){
  var el = div()
  debugger
  
  render(el, <span>Hello World</span>)
  assert.equal(el.innerHTML, '<span>Hello World</span>')
  remove(el)
  assert.equal(el.innerHTML, '')
  render(el, <span>Hello World</span>)
  assert.equal(el.innerHTML, '<div>Hello World</div>');
  remove(el)
  assert.equal(el.innerHTML, '');
})

it('should render and remove a component', function(){
  var Test = {
    render: function(){
      return dom('span', null, 'Hello World');
    }
  };
  var app = deku();
  app.mount(
    dom(Test)
  );
  var el = div();
  var renderer = render(app, el, { batching: false });
  assert.equal(el.innerHTML, '<span>Hello World</span>');
  renderer.remove();
  assert.equal(el.innerHTML, '');
})

it('should have initial state', function(){
  var DefaultState = {
    initialState: function(props){
      return {
        text: 'Hello World',
        count: props.initialCount
      };
    },
    render: function(component){
      let {props, state} = component
      return <span count={state.count}>{state.text}</span>;
    }
  };
  var app = deku();
  app.mount(<DefaultState initialCount={2} />);
  mount(app, function(el){
    assert.equal(el.innerHTML, '<span count="2">Hello World</span>')
  })
})

it('should create a component with properties', function(){
  var Test = {
    render(component) {
      let {props, state} = component
      return dom('span', null, [props.text])
    }
  }
  var app = deku()
  app.mount(dom(Test, { text: 'Hello World' }))
  mount(app, function(el){
    assert.equal(el.innerHTML, '<span>Hello World</span>')
  })
})

it('should compose components', function(){
  var Composed = {
    render: function(){
      return dom(HelloWorld);
    }
  };
  var app = deku();
  app.mount(dom(Composed));
  mount(app, function(el){
    assert.equal(el.innerHTML, '<span>Hello World</span>');
  })
});

it('should render a component using jsx', function(){
  var Test = {
    render: function(){
      return <span class="yup">Hello World</span>
    }
  };
  var app = deku()
  app.mount(<Test />)
  mount(app, function(el){
    assert.equal(el.innerHTML, '<span class="yup">Hello World</span>');
  })
})

it('should compose components and pass in props', function(){
  var Composed = {
    render: function(component){
      let {props, state} = component
      return dom(TwoWords, { one: 'Hello', two: 'World' });
    }
  };
  var app = deku()
  app.mount(<Composed />)
  mount(app, function(el){
    assert.equal(el.innerHTML, '<span>Hello World</span>');
  })
});

it('should update sub-components', function(){
  var Composed = {
    render: function(component){
      let {props, state} = component
      return (
        <div>
          <TwoWords one="Hello" two={props.app} />
        </div>
      );
    }
  };
  var app = deku()
  app.mount(<Composed app="Pluto" />)
  mount(app, function(el){
    assert.equal(el.innerHTML, '<div><span>Hello Pluto</span></div>')
  })
});

it('should update on the next frame', function(done){
  var Composed = {
    render: function(component){
      let {props, state} = component
      return (
        <div>
          <TwoWords one="Hello" two={props.planet} />
        </div>
      );
    }
  };
  var app = deku()
  app.mount(<Composed planet="Pluto" />)
  var el = div()
  var renderer = render(app, el)
  app.mount(<Composed planet="Saturn" />)
  assert.equal(el.innerHTML, '<div><span>Hello Pluto</span></div>')
  raf(function(){
    assert.equal(el.innerHTML, '<div><span>Hello Saturn</span></div>')
    renderer.remove();
    done()
  })
});

it('should allow components to have child nodes', function(){
  var ComponentA = {
    render: function(component){
      let {props, state} = component
      return dom('div', null, props.children);
    }
  };
  var ComponentB = {
    render: function(component){
      let {props, state} = component
      return dom(ComponentA, null, [
        dom('span', null, 'Hello World!')
      ]);
    }
  };
  var app = deku()
  app.mount(dom(ComponentB));
  mount(app, function(el){
    assert.equal(el.innerHTML, '<div><span>Hello World!</span></div>');
  })
});

it('should update component child nodes', function(){
  var ComponentA = {
    render: function(component){
      let {props, state} = component
      return dom('div', null, props.children);
    }
  };
  var ComponentB = {
    render: function(component){
      let {props, state} = component
      return dom(ComponentA, null, [
        dom('span', null, props.text)
      ]);
    }
  };
  var app = deku()
  app.mount(dom(ComponentB, { text: 'Hello world!' }));
  mount(app, function(el){
    app.mount(dom(ComponentB, { text: 'Hello Pluto!' }));
    assert.equal(el.innerHTML, '<div><span>Hello Pluto!</span></div>');
  })
});

it('should allow components to have other components as child nodes', function(){
  var ComponentA = {
    render: function(component){
      let {props, state} = component
      return dom('div', { name: 'ComponentA' }, props.children);
    }
  };
  var ComponentC = {
    render: function(component){
      let {props, state} = component
      return dom('div', { name: 'ComponentC' }, props.children);
    }
  };
  var ComponentB = {
    render: function(component){
      let {props, state} = component
      return dom('div', { name: 'ComponentB' }, [
        dom(ComponentA, null, [
          dom(ComponentC, { text: props.text }, [
            dom('span', null, 'Hello Pluto!')
          ])
        ])
      ]);
    }
  };
  var app = deku()
  app.mount(dom(ComponentB, { text: 'Hello World!' }))
  mount(app, function(el){
    assert.equal(el.innerHTML, '<div name="ComponentB"><div name="ComponentA"><div name="ComponentC"><span>Hello Pluto!</span></div></div></div>')
  })
});

it('should only update ONCE when props/state is changed in different parts of the tree', function(done){
  var i;
  var emitter = new Emitter();

  var ComponentA = {
    initialState: function(){
      return {
        text: 'Deku Shield'
      };
    },
    afterMount: function(component, el, send) {
      let {props, state} = component
      emitter.on('data', function(text){
        send({ text: text });
      })
    },
    render: function(component){
      let {props, state} = component
      i++;
      return dom('div', null, [props.text, ' ', state.text]);
    }
  };

  var ComponentB = {
    render: function(component){
      let {props, state} = component
      i++;
      return dom('div', null, [
        dom(ComponentA, { text: props.text })
      ]);
    }
  };

  var app = deku();
  app.mount(dom(ComponentB, { text: '2x' }))

  var el = div();
  var renderer = render(app, el)

  i = 0;

  // Mark ComponentA as dirty from a state change
  emitter.emit('data', 'Mirror Shield');

  // Update the top-level props
  app.mount(dom(ComponentB, { text: '3x' }))

  raf(function(){
    assert.equal(i, 2)
    assert.equal(el.innerHTML, "<div><div>3x Mirror Shield</div></div>")
    renderer.remove();
    done();
  });
});

it('should only update if shouldUpdate returns true', function(){
  var i = 0;
  var Component = {
    afterUpdate(){
      i = i + 1;
    },
    shouldUpdate(){
      return false;
    },
    render(){
      return dom('div')
    }
  };
  var app = deku()
  app.mount(<Component foo="bar" />)
  assert.equal(i, 0);
  mount(app, function(el){
    app.mount(<Component foo="baz" />)
    assert.equal(i, 0)
  })
});

it.skip('should not allow setting the state during render', function (done) {
  var Impure = {
    render: function(component, setState){
      let {props, state} = component
      assert(!setState);
      done();
      return dom();
    }
  };
  var app = deku()
  app.mount(<Impure />)
  mount(app)
});

describe('memoization', function () {

  it('should skip rendering if the same virtual element is returned', function (done) {
    var i = 0
    var el = <div>Hello World</div>
    var Component = {
      render(component){
        i += 1
        return el
      },
      afterUpdate() {
        throw new Error('Should not update')
      }
    };
    var app = deku(<Component count={0} />)
    mount(app, function(){
      app.mount(<Component count={1} />)
      assert.equal(i, 2)
      done()
    })
  });

  // Test is failing in IE10 because of memoizee
  it.skip('should allow memoization of the render function', function (done) {
    var i = 0
    var Component = {
      initialState: function() {
        return { open: false }
      },
      render: memoize(function (component) {
        let {props,state} = component
        i += 1
        return <div>Hello World</div>
      }),
      afterUpdate() {
        throw new Error('Should not update')
      }
    };
    var app = deku(<Component count={0} />)
    mount(app, function(){
      app.mount(<Component count={0} />)
      assert.equal(i, 1)
      done()
    })
  });

})

it('should empty the container before initial render', function () {
  var Component = {
    render: function () {
      return dom('div', [ 'b' ]);
    }
  };

  var el = div();
  el.innerHTML = '<div>a</div>';

  var app = deku(<Component />);
  var renderer = render(app, el);
  assert.equal(el.innerHTML, '<div>b</div>');
  renderer.remove()
})
