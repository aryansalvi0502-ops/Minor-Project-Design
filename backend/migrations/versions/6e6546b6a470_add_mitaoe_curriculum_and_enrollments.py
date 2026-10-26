"""add_mitaoe_curriculum_and_enrollments

Revision ID: 6e6546b6a470
Revises: a6e33e7278bf
Create Date: 2026-10-24 10:35:31.748937

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6e6546b6a470'
down_revision: Union[str, Sequence[str], None] = 'a6e33e7278bf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_tables = inspector.get_table_names()

    if 'institution_programs' not in existing_tables:
        op.create_table('institution_programs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('institution', sa.String(length=100), nullable=False),
        sa.Column('program_name', sa.String(length=150), nullable=False),
        sa.Column('department', sa.String(length=100), nullable=False),
        sa.Column('degree_type', sa.String(length=50), nullable=False),
        sa.Column('duration_years', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
        )
        with op.batch_alter_table('institution_programs', schema=None) as batch_op:
            batch_op.create_index(batch_op.f('ix_institution_programs_id'), ['id'], unique=False)
            batch_op.create_index(batch_op.f('ix_institution_programs_institution'), ['institution'], unique=False)
            batch_op.create_index(batch_op.f('ix_institution_programs_program_name'), ['program_name'], unique=False)

    if 'official_courses' not in existing_tables:
        op.create_table('official_courses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('program_id', sa.Integer(), nullable=False),
        sa.Column('institution', sa.String(length=100), nullable=False),
        sa.Column('curriculum_version', sa.String(length=50), nullable=False),
        sa.Column('semester', sa.Integer(), nullable=False),
        sa.Column('course_code', sa.String(length=50), nullable=False),
        sa.Column('course_title', sa.String(length=200), nullable=False),
        sa.Column('credits', sa.Float(), nullable=False),
        sa.Column('course_type', sa.String(length=50), nullable=False),
        sa.Column('syllabus_topics', sa.JSON(), nullable=True),
        sa.Column('source_url', sa.String(length=255), nullable=True),
        sa.Column('verification_status', sa.String(length=50), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['program_id'], ['institution_programs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
        )
        with op.batch_alter_table('official_courses', schema=None) as batch_op:
            batch_op.create_index(batch_op.f('ix_official_courses_course_code'), ['course_code'], unique=False)
            batch_op.create_index(batch_op.f('ix_official_courses_curriculum_version'), ['curriculum_version'], unique=False)
            batch_op.create_index(batch_op.f('ix_official_courses_id'), ['id'], unique=False)
            batch_op.create_index(batch_op.f('ix_official_courses_program_id'), ['program_id'], unique=False)
            batch_op.create_index(batch_op.f('ix_official_courses_semester'), ['semester'], unique=False)

    if 'student_course_enrollments' not in existing_tables:
        op.create_table('student_course_enrollments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('student_id', sa.Integer(), nullable=False),
        sa.Column('course_id', sa.Integer(), nullable=True),
        sa.Column('course_code', sa.String(length=50), nullable=False),
        sa.Column('course_title', sa.String(length=200), nullable=False),
        sa.Column('semester', sa.Integer(), nullable=False),
        sa.Column('enrollment_type', sa.String(length=50), nullable=False),
        sa.Column('is_confirmed', sa.Boolean(), nullable=False),
        sa.Column('confidence_level', sa.String(length=20), nullable=False),
        sa.Column('difficult_topics', sa.JSON(), nullable=True),
        sa.Column('academic_goal', sa.String(length=150), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['course_id'], ['official_courses.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['student_id'], ['student_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
        )
        with op.batch_alter_table('student_course_enrollments', schema=None) as batch_op:
            batch_op.create_index(batch_op.f('ix_student_course_enrollments_course_id'), ['course_id'], unique=False)
            batch_op.create_index(batch_op.f('ix_student_course_enrollments_id'), ['id'], unique=False)
            batch_op.create_index(batch_op.f('ix_student_course_enrollments_student_id'), ['student_id'], unique=False)

    profile_cols = [c['name'] for c in inspector.get_columns('student_profiles')]
    with op.batch_alter_table('student_profiles', schema=None) as batch_op:
        if 'institution' not in profile_cols:
            batch_op.add_column(sa.Column('institution', sa.String(length=100), nullable=False, server_default='MITAOE'))
        if 'degree_program' not in profile_cols:
            batch_op.add_column(sa.Column('degree_program', sa.String(length=150), nullable=False, server_default='Computer Engineering'))
        if 'admission_batch' not in profile_cols:
            batch_op.add_column(sa.Column('admission_batch', sa.String(length=50), nullable=False, server_default='2023-2027'))
        if 'curriculum_version' not in profile_cols:
            batch_op.add_column(sa.Column('curriculum_version', sa.String(length=50), nullable=False, server_default='Autonomous 2022'))

    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('student_profiles', schema=None) as batch_op:
        batch_op.drop_column('curriculum_version')
        batch_op.drop_column('admission_batch')
        batch_op.drop_column('degree_program')
        batch_op.drop_column('institution')

    with op.batch_alter_table('student_course_enrollments', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_student_course_enrollments_student_id'))
        batch_op.drop_index(batch_op.f('ix_student_course_enrollments_id'))
        batch_op.drop_index(batch_op.f('ix_student_course_enrollments_course_id'))

    op.drop_table('student_course_enrollments')
    with op.batch_alter_table('official_courses', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_official_courses_semester'))
        batch_op.drop_index(batch_op.f('ix_official_courses_program_id'))
        batch_op.drop_index(batch_op.f('ix_official_courses_id'))
        batch_op.drop_index(batch_op.f('ix_official_courses_curriculum_version'))
        batch_op.drop_index(batch_op.f('ix_official_courses_course_code'))

    op.drop_table('official_courses')
    with op.batch_alter_table('institution_programs', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_institution_programs_program_name'))
        batch_op.drop_index(batch_op.f('ix_institution_programs_institution'))
        batch_op.drop_index(batch_op.f('ix_institution_programs_id'))

    op.drop_table('institution_programs')
    # ### end Alembic commands ###
