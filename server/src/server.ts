
import { app } from './app';
import { PORT } from './configs/app.config';

app.listen(PORT, () => {
  console.log(`🚀 Server listening at http://localhost:${PORT}`);
});
