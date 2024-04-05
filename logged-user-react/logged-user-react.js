import { useTracker } from 'meteor/quave:react-meteor-data';
import { Meteor } from 'meteor/meteor';

export const useLoggedUser = () =>
  useTracker(() => {
    const loggedUser = Meteor.user();

    return { loggedUser, isLoadingLoggedUser: Meteor.userId() && !loggedUser };
  });
