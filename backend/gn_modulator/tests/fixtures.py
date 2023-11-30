import pytest
import datetime
from shapely.geometry import Point
from geoalchemy2.shape import from_shape
from sqlalchemy import func

from geonature.utils.env import db
from pypnnomenclature.repository import get_nomenclature_id_term
from pypnusershub.db.models import Organisme
from pypnusershub.db.models import (
    Organisme,
)

from m_sipaf.models import PassageFaune, Diagnostic, Actor


@pytest.fixture
def passages_faune_with_diagnostic(users):
    point = Point(5.92, 45.56)
    geom = from_shape(point, srid=4326)
    uuids = ["0c92af92-000b-401c-9994-f2c12470493a", "0c92af92-000b-401c-9994-f2c12470493b"]
    passages_faune = []
    with db.session.begin_nested():
        for uuid in uuids:
            pf = PassageFaune(geom=geom, uuid_passage_faune=uuid)
            db.session.add(pf)
            organisme = Organisme.query.filter_by(nom_organisme="ALL").one()
            pf.diagnostics.append(
                Diagnostic(
                    id_organisme=organisme.id_organisme, date_diagnostic="2017-01-08 20:00:00.000"
                )
            )
            if uuid == "0c92af92-000b-401c-9994-f2c12470493a":
                pf.actors.append(
                    Actor(
                        id_organism=users["user"].id_organisme,
                        id_nomenclature_type_actor=get_nomenclature_id_term(
                            "PF_TYPE_ACTOR", "PRO"
                        ),
                    )
                )
            passages_faune.append(pf)
    return passages_faune
