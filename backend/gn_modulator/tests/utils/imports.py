import pytest
from gn_modulator.imports.models import TImport
from gn_modulator.utils.commons import getAttr
from geonature.utils.env import db
from gn_modulator import SchemaMethods


@pytest.mark.skip()
def test_import_data_file(
    module_code,
    object_code,
    data_file_path=None,
    mapping_file_path=None,
    expected_infos={},
    options={},
):
    with db.session.begin_nested():
        # ici options={"insert_data": True} est à true pour intégrer les avec un insert

        # et non un copy qui ne marche pas en test
        impt = TImport(
            module_code=module_code,
            object_code=object_code,
            data_file_path=data_file_path,
            mapping_file_path=mapping_file_path,
            options={"no_commit": True, "insert_data": True, **options},
        )
        db.session.add(impt)
    assert impt.id_import is not None

    impt.process_import_schema()

    import_infos = SchemaMethods("modules.import").serialize(
        impt, fields=["errors", "res", "status", "id_import", "data_type", "csv_delimiter"]
    )

    expected_errors = expected_infos.pop("errors", [])
    if len(expected_errors) == 0:
        # on teste si le nombre d'erreur est bien nul
        assert not impt.has_errors(), impt.pretty_errors_txt()
    else:
        # on teste si on rencontre bien les erreurs attendues parmi les erreurs rencontrées
        assert len(expected_errors) == len(import_infos["errors"])
        for expected_error in expected_errors:
            assert (
                len(
                    [
                        e
                        for e in import_infos["errors"]
                        if expected_error["error_code"] == e["error_code"]
                    ]
                )
                > 0
            ), f"L'erreur de code {expected_error['error_code']} n'a pas été trouvée"

    expected_nb_errors = []
    for key in expected_infos:
        if getAttr(import_infos, key) == expected_infos.get(key):
            continue
        txt_expectation_error = (
            f"module_code: {module_code}, object_code: {object_code}, key: {key}"
        )
        txt_expectation_error += f", result: {getAttr(import_infos, key)}"
        txt_expectation_error += f", expected: {expected_infos.get(key)}"
        expected_nb_errors.append(txt_expectation_error)

    assert len(expected_nb_errors) == 0, "\n".join(expected_nb_errors)
    return impt
