const { Op } = require('sequelize');

const { Good, Auction, User, sequelize } = require('./models');
const schedule = require('node-schedule');

module.exports = async () => {
    try {
        const targets = await Good.findAll({
            where: {
                SoldId: null,
            },
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
                    end.setDate(end.getDate()  + 10);
                }

            }else{
                schedule.scheduleJob(end, async () => {
                    const success = await Auction.findOne({
                        where: { GoodId: good.id },
                        order: [['bid', 'DESC']],
                    });
                    await Good.update({ SoldId: success.UserId }, { where: { id: good.id } });
                    await User.update({
                        money: sequelize.literal(`money - ${success.bid}`),
                    }, {
                        where: { id: success.UserId },
                    });
                });
            }
        });


    } catch (error) {
        console.error(error);
    }
};