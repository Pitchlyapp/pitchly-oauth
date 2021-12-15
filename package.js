Package.describe({
  name: 'pitchly:pitchly-oauth',
  version: '1.0.0',
  summary: 'Pitchly OAuth flow',
  documentation: 'README.md'
});

Package.onUse(api => {
  api.use('ecmascript', ['client', 'server']);
  api.use('oauth2', ['client', 'server']);
  api.use('oauth', ['client', 'server']);
  api.use('fetch', 'server');
  api.use('random', 'client');
  api.use('service-configuration', ['client', 'server']);

  api.addFiles('pitchly_client.js', 'client');
  api.addFiles('pitchly_server.js', 'server');

  api.export('Pitchly');
});
