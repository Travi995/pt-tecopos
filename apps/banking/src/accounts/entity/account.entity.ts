import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Operation } from '../../operations/entity/operation.entity';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ unique: true })
  accountNumber: string;

  @Column()
  holderName: string;

  @Column({ default: 'USD' })
  currency: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  balance: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Operation, (operation) => operation.account)
  operations: Operation[];
}
