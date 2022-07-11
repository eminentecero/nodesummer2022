const Sequelize = require('sequelize');

module.exports = class Domain extends Sequelize.Model{
    static init(sequelize){
        return super.init({
            // 인터넷 주소
            host: {
                type: Sequelize.STRING(80),
                allowNull: false,
            },
            // 도메인 종류
            type: {
                type: Sequelize.STRING(10),
                allowNull: false,
            },
            // 클라이언트 비밀 키
            clientSecret: {
                type: Sequelize.UUID,
                allowNull: false,
            },
            // 서버 비밀 키
            serverSecret: {
                type: Sequelize.UUID,
                allowNull: false,
            },
        },{
            sequelize,
            timestamps: true,
            paranoid: true,
            modelName: 'Domain',
            tableName: 'domains',
        });
    }
    static associate(db) {
        db.Domain.belongsTo(db.User);
      }
};