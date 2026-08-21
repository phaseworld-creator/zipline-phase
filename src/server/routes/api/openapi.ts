import typedPlugin from '@/server/typedPlugin';

export const PATH = '/api/openapi.json';
export default typedPlugin(
  async (server) => {
    server.get(PATH, async (_req, res) => {
      return res.type('application/json').send(server.swagger());
    });
  },
  { name: PATH },
);
