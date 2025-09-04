import { BaseModel } from 'src/common/entity/base.entity';
import { Entity, Index } from 'typeorm';

@Entity('shoes')
@Index(['email', 'nickname'], { unique: false })
export class ShoeModel extends BaseModel {}
