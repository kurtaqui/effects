import 'rxjs/add/operator/take';
import 'rxjs/add/operator/toArray';
import 'rxjs/add/operator/map';
import 'rxjs/add/observable/of';
import { fakeAsync } from '@angular/core/testing';
import { ReflectiveInjector } from '@angular/core';
import { Action, provideStore, Dispatcher } from '@ngrx/store';

import { Actions } from '../src/actions';


describe('Actions', function() {
  let actions$: Actions;
  let dispatcher: Dispatcher;

  const ADD = 'ADD';
  const SUBTRACT = 'SUBTRACT';

  function reducer(state: number = 0, action: Action) {
    switch (action.type) {
      case ADD:
        return state + 1;
      case SUBTRACT:
        return state - 1;
      default:
        return state;
    }
  }

  beforeEach(function() {
    const injector = ReflectiveInjector.resolveAndCreate([
      provideStore(reducer),
      Actions
    ]);

    actions$ = injector.get(Actions);
    dispatcher = injector.get(Dispatcher);
  });

  it('should be an observable of actions', function() {
    const actions = [
      { type: ADD },
      { type: SUBTRACT },
      { type: SUBTRACT },
      { type: SUBTRACT }
    ];

    let iterations = [
      { type: Dispatcher.INIT },
      ...actions
    ];

    actions$.subscribe({
      next(value) {
        let change = iterations.shift();
        expect(value.type).toEqual(change.type);
      }
    });

    actions.forEach(action => dispatcher.dispatch(action));
  });

  it('should let you filter out actions', function() {
    const actions = [ ADD, ADD, SUBTRACT, ADD, SUBTRACT ];
    const expected = actions.filter(type => type === ADD);

    actions$
      .ofType(ADD)
      .map(update => update.type)
      .toArray()
      .subscribe({
        next(actual) {
          expect(actual).toEqual(expected);
        }
      });

    actions.forEach(action => dispatcher.dispatch({ type: action }));
    dispatcher.complete();
  });
    it('should let you filter out grouped actions', fakeAsync(() => {
    const actions = [ADD, ADD, SUBTRACT];
    const spy = jasmine.createSpy('spy', (): null => null);
    actions$
      .groupOfType(ADD, SUBTRACT)
      .subscribe(spy);

    actions.forEach(action => dispatcher.dispatch({ type: action }));
    dispatcher.complete();

    expect(spy).toHaveBeenCalled();
  }));

  it('should let you filter out grouped actions multiple times', fakeAsync(() => {
    const actions = [ADD, SUBTRACT, ADD, SUBTRACT];
    const spy = jasmine.createSpy('spy', (): null => null);
    actions$
      .groupOfType(ADD, SUBTRACT)
      .subscribe(spy);

    actions.forEach(action => dispatcher.dispatch({ type: action }));
    dispatcher.complete();

    expect(spy).toHaveBeenCalledTimes(2);
  }));

  it('should not be called if not all actions are dispatched', fakeAsync(() => {
    const actions = [ADD, ADD];
    const spy = jasmine.createSpy('spy', (): null => null);
    actions$
      .groupOfType(ADD, SUBTRACT)
      .subscribe(spy);

    actions.forEach(action => dispatcher.dispatch({ type: action }));
    dispatcher.complete();

    expect(spy).not.toHaveBeenCalled();
  }));
});
