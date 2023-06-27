# modeles d'import
from flask import g
from sqlalchemy.dialects.postgresql import JSONB
from geonature.utils.env import db
from .mixins import ImportMixin
from sqlalchemy.ext.mutable import MutableDict, MutableList


class TImport(db.Model, ImportMixin):
    __tablename__ = "t_imports"
    __table_args__ = {"schema": "gn_modulator"}

    def __init__(
        self,
        module_code=None,
        object_code=None,
        schema_code=None,
        data_file_path=None,
        mapping_file_path=None,
        mapping=None,
        options={},
    ):
        self.id_digitiser = g.current_user.id_role if hasattr(g, "current_user") else None

        self.schema_code = schema_code
        self.module_code = module_code
        self.object_code = object_code
        self.data_file_path = data_file_path and str(data_file_path)
        self.mapping_file_path = mapping_file_path and str(mapping_file_path)

        self.mapping = mapping
        self.options = options

        self.res = {}
        self.errors = []
        self.sql = {}
        self.tables = {}

    _columns = {}

    id_import = db.Column(db.Integer, primary_key=True)

    id_digitiser = db.Column(db.Integer, db.ForeignKey("utilisateurs.t_roles.id_role"))
    module_code = db.Column(db.Unicode)
    object_code = db.Column(db.Unicode)
    schema_code = db.Column(db.Unicode)

    status = db.Column(db.Unicode)

    data_file_path = db.Column(db.Unicode)
    mapping_file_path = db.Column(db.Unicode)
    mapping = db.Column(db.Unicode)

    csv_delimiter = db.Column(db.Unicode)
    data_type = db.Column(db.Unicode)

    res = db.Column(MutableDict.as_mutable(JSONB))
    tables = db.Column(MutableDict.as_mutable(JSONB))
    sql = db.Column(MutableDict.as_mutable(JSONB))
    errors = db.Column(MutableList.as_mutable(JSONB))

    options = db.Column(MutableDict.as_mutable(JSONB))

    def as_dict(self):
        return {
            "id_import": self.id_import,
            "schema_code": self.schema_code,
            "module_code": self.module_code,
            "object_code": self.object_code,
            "id_digitiser": self.id_digitiser,
            "data_type": self.data_type,
            "csv_delimiter": self.csv_delimiter,
            "res": self.res,
            "errors": self.errors,
            "options": self.options,
            "tables": self.tables,
            "status": self.status,
        }
