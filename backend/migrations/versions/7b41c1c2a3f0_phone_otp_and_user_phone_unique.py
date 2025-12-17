"""phone otp and unique phone

Revision ID: 7b41c1c2a3f0
Revises: c0764d53c072
Create Date: 2025-12-14

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7b41c1c2a3f0'
down_revision = 'c0764d53c072'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'phone_otps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('code_hash', sa.String(length=256), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('used_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    with op.batch_alter_table('phone_otps', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_phone_otps_phone'), ['phone'], unique=False)
        batch_op.create_index(batch_op.f('ix_phone_otps_expires_at'), ['expires_at'], unique=False)

    # Users: unique index for phone (nullable allowed)
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_users_phone'), ['phone'], unique=True)


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_phone'))

    op.drop_table('phone_otps')




