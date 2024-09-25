import React, { useState, useEffect } from 'react';

export const Transition = ({
  show,
  enter,
  enterFrom,
  enterTo,
  leave,
  leaveFrom,
  leaveTo,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [classes, setClasses] = useState('');

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setClasses(`${enterFrom} ${enter}`);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setClasses(`${enterTo} ${enter}`);
        });
      });
    } else {
      setClasses(`${leaveFrom} ${leave}`);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setClasses(`${leaveTo} ${leave}`);
        });
      });
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 100); // Adjust this value to match your leave duration
      return () => clearTimeout(timer);
    }
  }, [show, enter, enterFrom, enterTo, leave, leaveFrom, leaveTo]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={classes}>
      {children}
    </div>
  );
};