import { combineReducers } from 'redux';

import listsReducer from './listsReducer';
import userReducer from './userReducer';

export default combineReducers({
    lists: listsReducer,
    user: userReducer
});