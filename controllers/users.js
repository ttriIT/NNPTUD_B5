let userModel = require("../schemas/users");
let bcrypt = require('bcrypt')
let jwt = require('jsonwebtoken')
let fs = require('fs')

module.exports = {
    CreateAnUser: async function (username, password, email, role, fullName, avatarUrl, status, loginCount) {
        let newItem = new userModel({
            username: username,
            password: password,
            email: email,
            fullName: fullName,
            avatarUrl: avatarUrl,
            status: status,
            role: role,
            loginCount: loginCount
        });
        await newItem.save();
        return newItem;
    },
    GetAllUser: async function () {
        return await userModel
            .find({ isDeleted: false })
    },
    GetUserById: async function (id) {
        try {
            return await userModel
                .find({
                    isDeleted: false,
                    _id: id
                })
        } catch (error) {
            return false;
        }
    },
    QueryLogin: async function (username, password) {
        if (!username || !password) {
            return false;
        }
        let user = await userModel.findOne({
            username: username,
            isDeleted: false
        })
        if (user) {
            if (bcrypt.compareSync(password, user.password)) {
                let privateKey = fs.readFileSync('private-key.pem', 'utf8');
                return jwt.sign({
                    id: user.id
                }, privateKey, {
                    algorithm: 'RS256',
                    expiresIn: '1d'
                })
            } else {
                return false;
            }
        } else {
            return false;
        }
    },
    ChangePassword: async function (userId, oldPassword, newPassword) {
        let user = await userModel.findById(userId);
        if (!user) {
            throw new Error("Người dùng không tồn tại");
        }
        if (!bcrypt.compareSync(oldPassword, user.password)) {
            throw new Error("Mật khẩu cũ không chính xác");
        }
        user.password = newPassword; // Mongoose middleware or manual hashing should handle this, checking controller...
        // Note: The previous CreateAnUser doesn't seem to have a pre-save hook for hashing, I should hash it here if it's not handled by the schema.
        user.password = bcrypt.hashSync(newPassword, 10);
        await user.save();
        return { message: "Đổi mật khẩu thành công" };
    }
}