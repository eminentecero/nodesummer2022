const swaggerJSDoc = require('swagger-jsdoc');

var swaggerDefinition = {
    info : { // 정보 작성
        title : "nodebird-api",
        version : "1.0.0",
        description : "nodebird API DOCs" 
    },
    host : "localhost:8002", // base-url
    basePath : "/" // base path
};

var options = {
    swaggerDefinition: swaggerDefinition,
    apis: ["./routes/*.js", "./routes/user/*.js"], //Swagger 파일 연동
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;