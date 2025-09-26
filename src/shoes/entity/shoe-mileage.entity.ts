import { BaseModel } from 'src/common/entity/base.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { ShoeModel } from './shoes.entity';
import { RunModel } from 'src/run/entity/run.entity';

@Entity('shoe_mileages')
@Index(['shoeId'])
@Index(['runId'], { unique: true }) // 한 Run은 하나의 신발에만 연결
export class ShoeMileageModel extends BaseModel {
  @Column()
  shoeId: string;

  @ManyToOne(() => ShoeModel, (shoe) => shoe.mileages, { onDelete: 'CASCADE' })
  shoe: ShoeModel;

  @Column()
  runId: string;

  @OneToOne(() => RunModel, { onDelete: 'CASCADE' })
  @JoinColumn()
  run: RunModel;
}
