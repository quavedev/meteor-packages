import React, { Fragment, useContext, useState } from 'react';
import { getSettings } from 'meteor/quave:settings';
import { useNavigate } from 'react-router-dom';
import { Transition } from './Transition';

const PACKAGE_NAME = 'quave:alert-react-tailwind';

const settings = getSettings({ packageName: PACKAGE_NAME });

let timeoutId = null;
const clearTimeoutId = () => {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
};

const AlertContext = React.createContext({
  isOpen: false,
  message: '',
  title: '',
  route: '',
  buttonLabel: '',
  isError: false,
});

export const AlertProvider = ({ children, ...rest }) => {
  const [isOpen, setIsOpen] = useState(rest.isOpen);
  const [message, setMessage] = useState(rest.message);
  const [title, setTitle] = useState(rest.title);
  const [route, setRoute] = useState(rest.route);
  const [buttonLabel, setButtonLabel] = useState(rest.buttonLabel);
  const [isError, setIsError] = useState(rest.isError);

  const closeAlert = () => {
    setIsOpen(false);
    clearTimeoutId();
  };
  const openAlert = (args) => {
    const {
      autoCloseTimeout: autoCloseTimeoutParam,
      message: messageParam,
      route: routeParam,
      buttonLabel: buttonLabelParam,
      isError: isErrorParam,
    } = typeof args === 'string'
      ? {
          message: args,
          route: '',
          buttonLabel: '',
        }
      : args;

    setIsOpen(true);
    clearTimeoutId();

    const autoCloseTimeout =
      autoCloseTimeoutParam || settings?.autoCloseTimeout;
    if (autoCloseTimeout) {
      timeoutId = setTimeout(() => {
        closeAlert();
      }, autoCloseTimeout);
    }
    setMessage(messageParam);
    setRoute(routeParam || '');
    setButtonLabel(buttonLabelParam || '');
    setIsError(isErrorParam || false);
  };

  return (
    <AlertContext.Provider
      value={{
        openAlert,
        closeAlert,
        message,
        setMessage,
        title,
        setTitle,
        route,
        buttonLabel,
        isOpen,
        isError,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
export const Alert = ({
  Component,
  ExclamationIcon = () => {},
  MessageIcon = () => {},
  XIcon = () => {},
}) => {
  const props = useAlert();
  const {
    isOpen,
    closeAlert,
    message,
    setMessage,
    title,
    setTitle,
    route,
    buttonLabel,
    isError,
  } = props;
  const navigate = useNavigate();

  const clear = () => {
    setMessage('');
    setTitle('');
    closeAlert();
  };

  const onButtonClick = () => {
    if (route) {
      navigate(route);
      clear();
    }
  };

  if (Component) {
    return <Component onButtonClick={onButtonClick} clear={clear} {...props} />;
  }

  return (
    <div className="pointer-events-none absolute right-0 top-0 z-10 flex justify-end">
      <div
        aria-live="assertive"
        className="relative flex items-start justify-end"
      >
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
          <Transition
            show={isOpen && message}
            enter="transform ease-out duration-300 transition"
            enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
            enterTo="translate-y-0 opacity-100 sm:translate-x-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {isError ? (
                      <ExclamationIcon
                        className="h-5 w-5 text-red-500"
                        aria-hidden="true"
                      />
                    ) : (
                      <MessageIcon
                        className="h-5 w-5 text-green-500"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-gray-900">
                      {title || 'Notification'}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">{message}</p>
                    <div className="mt-3 flex space-x-7">
                      {buttonLabel && (
                        <button
                          onClick={onButtonClick}
                          type="button"
                          className="rounded-md bg-white text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                          {buttonLabel}
                        </button>
                      )}
                      <button
                        onClick={clear}
                        type="button"
                        className="rounded-md bg-white text-sm font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-shrink-0">
                    <button
                      className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={clear}
                    >
                      <span className="sr-only">close</span>
                      <XIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  );
};
