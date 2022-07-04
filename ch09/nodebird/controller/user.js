const User = require('../models/user');

exports.addFollowing = async(req, res, next) => {
    try{
        console.log('들어오나?');
        const user = await User.findOne({where: {id: req.user.id}});
        if(user){
            await user.addFollowing(parseInt(req.params.id, 10));
            console.log('잘 되어지나?');
            res.send('success');
        }else{
            res.status(404).send('no user');
        }
    }catch(error){
        console.error(error)
        next(error);
    }
};

exports.unFollowing = async(req, res, next) => {
    try{
        const user = await User.findOne({where: {id: req.user.id}});
        if(user){
            await user.removeFollowing(parseInt(req.params.id, 10));
            res.send('success');
        }else{
            res.status(404).send('no user');
        }
    }catch(error){
        console.error(error)
        next(error);
    }
}

