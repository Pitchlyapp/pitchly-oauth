Pitchly = {};

OAuth.registerService('pitchly', 2, null, async (query) => {
  
  const config = await ServiceConfiguration.configurations.findOneAsync({
    service: 'pitchly'
  });
  if (!config) throw new ServiceConfiguration.ConfigError();
  
  const accessTokenResponse = await getAccessToken(config, query);
  
  const identity = await getIdentity(config, accessTokenResponse.access_token);
  
  const serviceData = {
    id: identity.viewer.person.id,
    name: identity.viewer.person.name,
    email: identity.viewer.person.email,
    picture: identity.viewer.person.image,
    tier: identity.viewer.tier,
    tierSettings: identity.viewer.tierSettings,
    organizationId: identity.organization.id,
    accessToken: OAuth.sealSecret(accessTokenResponse.access_token)
  };
  
  if (typeof accessTokenResponse.expires_in=="number") {
    Object.assign(serviceData, { accessTokenExpiresAt: Date.now() + (1000 * parseInt(accessTokenResponse.expires_in, 10)) });
  }
  
  if (accessTokenResponse.refresh_token) {
    Object.assign(serviceData, { refreshToken: OAuth.sealSecret(accessTokenResponse.refresh_token) });
  }
  
  // if (typeof accessTokenResponse.scope=="string") {
  //   if (accessTokenResponse.scope) {
  //     Object.assign(serviceData, { scope: accessTokenResponse.scope.split(" ") });
  //   } else {
  //     Object.assign(serviceData, { scope: [] });
  //   }
  // }
  
  Object.assign(serviceData, { updatedAt: Date.now() });

  return {
    serviceData,
    options: {
      // profile: {
      //   name: serviceData.name
      // }
    }
  };
  
});

let userAgent = 'Meteor';
if (Meteor.release) userAgent += `/${Meteor.release}`;

const getAccessToken = async (config, query) => {
  let response;
  try {
    const params = {
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: OAuth.openSecret(config.secret),
      code: query.code,
      redirect_uri: OAuth._redirectUri('pitchly', config),
      code_verifier: 'hd1tRU1AKBER3cDCwHhGMJM4o5a4x5aXCzMkqs6ZF5J'
    };
    // By default, the access token saved in this user's service data has
    // all the scopes authorized to this app by the org it's installed on.
    // But that also means the frontend will have access to all those scopes
    // because the access token is also autopublished to the logged-in user.
    // If we want to limit the scopes of the frontend-accessible access token,
    // put a "scope" in this service's Service Configuration with either a
    // space-delimited string value or array of scopes. The refresh token will
    // not be downscoped, so it can still be used to gain elevated scopes on
    // the backend manually if necessary.
    if (typeof config.accessTokenScope=="string") {
      params.scope = config.accessTokenScope;
    } else if (Array.isArray(config.accessTokenScope)) {
      params.scope = config.accessTokenScope.join(" ");
    }
    const content = new URLSearchParams(params);
    const request = await fetch(
      `${config.origin || 'https://platform.pitchly.com'}/api/oauth/token`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'User-Agent': userAgent
        },
        body: content
      }
    );
    response = await request.json();
  } catch (err) {
    throw Object.assign(
      new Error(`Failed to complete OAuth handshake with Pitchly. ${err.message}`),
      { response: err.response }
    );
  }
  if (response.error) {
    // if the http response was a json object with an error attribute
    throw new Error(`Failed to complete OAuth handshake with Pitchly. ${response.error}`);
  } else {
    return response;
  }
};

// get user's profile data

const getIdentity = async (config, accessToken) => {
  let response;
  try {
    const request = await fetch(`${config.apiOrigin || 'https://main--pitchly.apollographos.net'}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': userAgent,
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        query: `{
          organization {
            id
          }
          viewer {
            person {
              id
              name
              email
              image
            }
            tier
            tierSettings
          }
        }`
      })
    });
    response = await request.json();
  } catch (err) {
    throw Object.assign(
      new Error(`Failed to fetch identity from Pitchly. ${err.message}`),
      { response: err.response }
    );
  }
  if (!response.data) {
    const error = (Array.isArray(response.errors) && response.errors.length && typeof response.errors[0]=="object" && response.errors[0]!==null && typeof response.errors[0].extensions=="object" && response.errors[0].extensions!==null && typeof response.errors[0].extensions.code=="string") ? response.errors[0].extensions.code : "GraphQL API request failed.";
    // return GraphQL error code if there was one
    throw new Error(`Failed to fetch identity from Pitchly. ${error}`);
  } else {
    return response.data;
  }
};

Pitchly.retrieveCredential = (credentialToken, credentialSecret) =>
  OAuth.retrieveCredential(credentialToken, credentialSecret);
