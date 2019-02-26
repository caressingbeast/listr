import { createStore } from 'redux';

import indexReducer from './reducers/indexReducer';

const store = createStore(
    indexReducer,
    {}
);

export default store;