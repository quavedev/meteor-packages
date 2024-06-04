import { getProfiler } from './profile.js';
import v8Profiler from 'v8-profiler-next';

import './method';

const { startProfile, stopProfile } = getProfiler(v8Profiler);

const profileDuration = (
  profileName,
  exportPath,
  duration,
  profileConsumer
) => {
  startProfile(profileName, { exportPath });
  setTimeout(() => stopProfile(profileName, profileConsumer), duration);
};

export default {
  startProfile,
  stopProfile,
  profileDuration,
};
