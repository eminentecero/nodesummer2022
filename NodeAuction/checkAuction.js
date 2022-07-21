const { Op } = require('sequelize');

const { Good, Auction, User, sequelize } = require('./models');
const schedule = require('node-schedule');

module.exports = async () => {
    try {
        const targets = await Good.findAll({
            where: {
                SoldId: null,
            }
        });
        
        targets.forEach(async (target) => {
            const end = new Date();
            end.setHours(end.getHours() + target.time);
            
            if(end < new Date()){
                const success = await Auction.findOne({
                    where: { GoodId: target.id },
                    order: [['bid', 'DESC']],
                });
                if(success){
                    await Good.update({ Soldid: success.UserId }, { where: { id: target.id } });
                    await User.update({
                        money: sequelize.literal(`money - ${success.bid}`),
                    }, {
                        where: { id: success.UserId },
                    });
                }else{
                    // 1. 낙찰 시간을 연장
                    // end.setDate(end.getDate()  + 10);
                    // 2. 낙찰자를 해당 물품 등록자로
                    await Good.update({Soldid: target.ownerId}, {where: {id: target.id}});
                }

            }else{
                schedule.scheduleJob(end, async () => {
                    const success = await Auction.findOne({
                        where: { GoodId: good.id },
                        order: [['bid', 'DESC']],
                    });
                    if(success){
                        await Good.update({ Soldid: success.UserId }, { where: { id: target.id } });
                        await User.update({
                            money: sequelize.literal(`money - ${success.bid}`),
                        }, {
                            where: { id: success.UserId },
                        });
                    }else{
                        // 1. 낙찰 시간을 연장
                        // end.setDate(end.getDate()  + 10);
                        // 2. 낙찰자를 해당 물품 등록자로
                        await Good.update({Soldid: good.ownerId}, {where: {id: target.id}});
                    }
                });
            }
        });


    } catch (error) {
        console.error(error);
    }
};