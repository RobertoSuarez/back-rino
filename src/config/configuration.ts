import { registerAs } from '@nestjs/config';

export default registerAs('config', () => {
  return {
    database: {
      type: process.env.DATABASE_TYPE,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT,
      name: process.env.DATABASE_NAME,
    },
    // openai: {
    //   key: process.env.OPENAI_KEY,
    // },
    apiKey: process.env.API_KEY,
    jwtSecret: process.env.JWT_SECRET,
    // Comentamos la configuración de Cloudinary para que el proyecto funcione sin esta dependencia
    /*
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    */
  };
});
