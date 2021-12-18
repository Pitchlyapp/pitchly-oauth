Pitchly = {};

// Request Pitchly credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
Pitchly.requestCredential = (options, credentialRequestCompleteCallback) => {
  // support both (options, callback) and (callback).
  if (!credentialRequestCompleteCallback && typeof options === 'function') {
    credentialRequestCompleteCallback = options;
    options = {};
  }

  const config = ServiceConfiguration.configurations.findOne({service: 'pitchly'});
  if (!config) {
    credentialRequestCompleteCallback && credentialRequestCompleteCallback(
      new ServiceConfiguration.ConfigError());
    return;
  }
  const credentialToken = Random.secret();

  // const scope = (options && options.requestPermissions) || ['user:email'];
  // const flatScope = scope.map(encodeURIComponent).join('+');

  const loginStyle = OAuth._loginStyle('pitchly', config, options);

  const loginUrl =
    `${config.origin || 'https://platform.pitchly.com'}/oauth/authorize` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(config.clientId)}` +
    // `&scope=${encodeURIComponent(flatScope)}` +
    `&redirect_uri=${encodeURIComponent(OAuth._redirectUri('pitchly', config))}` +
    `&state=${encodeURIComponent(OAuth._stateParam(loginStyle, credentialToken, options && options.redirectUrl))}` +
    `&code_challenge=hd1tRU1AKBER3cDCwHhGMJM4o5a4x5aXCzMkqs6ZF5J`;
  
  const popupWidth = (options && options.popupOptions && typeof options.popupOptions.width=="number") ? options.popupOptions.width : 800;
  const popupHeight = (options && options.popupOptions && typeof options.popupOptions.height=="number") ? options.popupOptions.height : 750;

  OAuth.launchLogin({
    loginService: "pitchly",
    loginStyle,
    loginUrl,
    credentialRequestCompleteCallback,
    credentialToken,
    popupOptions: { width: popupWidth, height: popupHeight }
  });
};
