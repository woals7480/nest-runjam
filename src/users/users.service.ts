import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserModel } from './entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from 'src/auth/dto/register-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserModel)
    private userRepository: Repository<UserModel>,
  ) {}

  async findById(id: string) {
    return await this.userRepository.findOne({ where: { id } });
  }

  findByEmail(email: string) {
    return this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email })
      .getOne();
  }

  async create(user: RegisterUserDto) {
    const emailExits = await this.userRepository.findOne({
      where: { email: user.email },
    });
    if (emailExits) {
      throw new BadRequestException('이미 사용중인 이메일입니다.');
    }

    const nicknameExits = await this.userRepository.findOne({
      where: { nickname: user.nickname },
    });
    if (nicknameExits) {
      throw new BadRequestException('이미 사용중인 닉네임입니다.');
    }

    const passwordHash = await bcrypt.hash(
      user.password,
      parseInt(process.env.HASH_ROUNDS!),
    );

    const newUser = this.userRepository.create({
      email: user.email,
      password: passwordHash,
      nickname: user.nickname,
    });

    return this.userRepository.save(newUser);
  }

  sanitize(user: UserModel) {
    const { password, ...rest } = user;
    return rest as Omit<UserModel, 'password'>;
  }
}
