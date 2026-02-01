import { config } from './environment';

describe('Environment Configuration', () => {
  it('should load configuration successfully', () => {
    expect(config).toBeDefined();
    expect(config.env).toBeDefined();
    expect(config.server).toBeDefined();
    expect(config.server.port).toBeGreaterThan(0);
  });

  it('should have required database configuration', () => {
    expect(config.database).toBeDefined();
    expect(config.database.url).toBeDefined();
  });

  it('should have JWT configuration', () => {
    expect(config.jwt).toBeDefined();
    expect(config.jwt.secret).toBeDefined();
    expect(config.jwt.expiresIn).toBeDefined();
  });

  it('should have CORS configuration', () => {
    expect(config.cors).toBeDefined();
    expect(config.cors.allowedOrigins).toBeInstanceOf(Array);
  });
});