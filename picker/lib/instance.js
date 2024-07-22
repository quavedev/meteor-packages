import { WebApp } from 'meteor/webapp';
import { PickerImp } from './implementation';

export const Picker = new PickerImp();
const hasExpressHandler = !!WebApp.rawExpressHandlers;

WebApp[hasExpressHandler ? 'rawExpressHandlers' : 'rawConnectHandlers'].use(
  (req, res, next) => Picker._dispatch(req, res, next)
);
