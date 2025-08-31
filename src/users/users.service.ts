import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserModel } from './entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserModel)
    private userRepository: Repository<UserModel>,
  ) {}

  findById(id: string) {
    return this.userRepository.findOne({ where: { id } });
  }

  findByEmail(email: string) {
    return this.userRepository
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('u.email = :email', { email })
      .getOne();
  }

  async create(email: string, password: string, nickname: string) {
    const emailExits = await this.userRepository.findOne({ where: { email } });
    if (emailExits) {
      throw new BadRequestException('이미 사용중인 이메일입니다.');
    }

    const nicknameExits = await this.userRepository.findOne({
      where: { nickname },
    });
    if (nicknameExits) {
      throw new BadRequestException('이미 사용중인 닉네임입니다.');
    }

    const passwordHash = await bcrypt.hash(
      password,
      parseInt(process.env.HASH_ROUNDS!),
    );

    const user = this.userRepository.create({
      email,
      password: passwordHash,
      nickname,
    });

    return this.userRepository.save(user);
  }

  sanitize(user: UserModel) {
    const { password, ...rest } = user;
    return rest as Omit<UserModel, 'password'>;
  }
}
