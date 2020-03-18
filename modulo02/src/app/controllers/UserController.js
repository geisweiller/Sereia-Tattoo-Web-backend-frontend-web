import * as Yup from 'yup';
import User from '../models/User';

class UserController {
    async store(req, res) {
        // Validar se as informações foram inseridas corretamente

        const schema = Yup.object().shape({
            name: Yup.string().required(),
            email: Yup.string()
                .email()
                .required(),
            password: Yup.string()
                .required()
                .min(6),
        });

        if (!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: 'Falha de Validação.' });
        }

        // Checar se ja existe usuario com mesmo email na tabela

        const userExists = await User.findOne({
            where: { email: req.body.email },
        });

        if (userExists) {
            return res.status(400).json({ error: 'Usuário já existente.' });
        }

        // Criar usuário

        const { id, name, email, provider } = await User.create(req.body);

        return res.json({
            id,
            name,
            email,
            provider,
        });
    }

    // Mudar informações do usuário

    async update(req, res) {
        // Validar se as informações foram inseridas corretamente
        const schema = Yup.object().shape({
            name: Yup.string(),
            email: Yup.string().email(),
            oldPassword: Yup.string().min(6),
            password: Yup.string()
                .min(6)
                .when('oldPassword', (oldPassword, field) =>
                    oldPassword ? field.required() : field
                ),
            confirmPassword: Yup.string().when('password', (password, field) =>
                password ? field.required().oneOf([Yup.ref('password')]) : field
            ),
        });

        if (!(await schema.isValid(req.body))) {
            return res.status(400).json({ error: 'Falha de Validação.' });
        }

        // buscar informações no body

        const { email, oldPassword } = req.body;

        // Buscar e selecionar o usuario na tabela

        const user = await User.findByPk(req.userId);

        if (email && email !== user.email) {
            const userExists = await User.findOne({ where: { email } });

            if (userExists) {
                return res.status(400).json({ error: 'Usuário já existente.' });
            }
        }

        if (oldPassword && !(await user.checkPassword(oldPassword))) {
            return res.status(401).json({
                error: 'A senha digitada não coincide com sua senha anterior',
            });
        }
        const { id, name, provider } = await user.update(req.body);

        return res.json({
            id,
            name,
            email,
            provider,
        });
    }
}

export default new UserController();
