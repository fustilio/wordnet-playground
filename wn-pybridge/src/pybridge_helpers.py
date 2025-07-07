import json

def morphy_to_json(morphy, form, pos=None):
    result = morphy(form, pos)
    return json.dumps({k if k is not None else 'null': list(v) for k, v in result.items()}) 