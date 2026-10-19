
from datetime import date

import pycountry
from babel.numbers import get_territory_currencies


def get_global_country_currency_options():
    countries = []
    currencies = []

    today = date.today()

    # Build country list using ISO 3166-1
    for country in pycountry.countries:
        country_code = country.alpha_2

        # Get currencies currently in use in this territory
        country_currencies = get_territory_currencies(
            country_code,
            start_date=today,
            end_date=today,
            tender=True,
            non_tender=False,
        )

        countries.append({
            "code": country_code,
            "name": country.name,
            "default_currency": (
                country_currencies[0]
                if country_currencies
                else None
            ),
            "currencies": country_currencies,
        })

    # Build the global ISO 4217 currency list
    for currency in pycountry.currencies:
        currencies.append({
            "code": currency.alpha_3,
            "name": currency.name,
        })

    return {
        "countries": sorted(
            countries,
            key=lambda item: item["name"],
        ),
        "currencies": sorted(
            currencies,
            key=lambda item: item["name"],
        ),
    }
