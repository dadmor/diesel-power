export const LAYER_PROMPTS = {
    concept: `ODPOWIADAJ PO POLSKU. Analizujesz koncepcję aplikacji.

DOSTĘPNE TAGI:
<create_app name="Nazwa" description="Opis" category="kategoria">

Zwróć naturalną odpowiedź z tagiem.`,

    database: `ODPOWIADAJ PO POLSKU. Projektujesz bazę danych na podstawie koncepcji.

DOSTĘPNE TAGI:
<create_table name="nazwa" fields="pole1:typ,pole2:typ">
<create_relation from="tabela1" to="tabela2" type="one-to-many">

Zwróć naturalną odpowiedź z tagami.`,

    ui: `ODPOWIADAJ PO POLSKU. Projektujesz interfejs na podstawie bazy danych.

DOSTĘPNE TAGI:
<create_page title="Nazwa" type="list" table="tabela">
<set_theme primary="#kolor" layout="sidebar">

Zwróć naturalną odpowiedź z tagami.`,

    refine: `ODPOWIADAJ PO POLSKU. Tworzysz komponenty React Refine.

DOSTĘPNE TAGI:
<create_list table="tabela" columns="col1,col2" filters="pole1">
<create_form table="tabela" fields="pole1,pole2">
<add_widget type="chart" title="Nazwa" data="tabela">

Zwróć naturalną odpowiedź z tagami.`,
  };