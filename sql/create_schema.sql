drop table if exists COMORBIDADE;
drop table if exists ECMO;
drop table if exists VMI;
drop table if exists EPISODIO;
drop table if exists PROCESSO;
drop table if exists VACINA;
drop table if exists PAIS;
drop table if exists MOTIVO_ADMISSAO;
drop table if exists LOGIN;

create table LOGIN (
	utilizador varchar(15) primary key,
	senha varchar(110) not null,
	ativo tinyint default 1 not null,
	role varchar(20) not null
);

create table MOTIVO_ADMISSAO (
	ID_MOTIVO int primary key,
	MOTIVO varchar(40)
);

create table PAIS (
	ID_PAIS int primary key,
	PAIS_NOME varchar(20)
);

create table VACINA (
	ID_VACINA int primary key,
	VACINA_MARCA varchar(15)
);

create table PROCESSO (
	ID_PACIENTE int primary key,
	SEXO tinyint,
	PAIS_ORIGEM int,
	
	foreign key (PAIS_ORIGEM) references PAIS(ID_PAIS)
);

create table EPISODIO (
	ID_EPISODIO int not null primary key,
	ID_PACIENTE int references PROCESSO,
	DATA_ADMISSAO_UCI datetime,
	DATA_SINT_DIAG datetime,
	IDADE int,
	VAGA int,
	COVID tinyint,
	UUM tinyint,
	MOTIVO_ADMISSAO int,
	DATA_ALTA_UCI datetime,
	DATA_ALTA_HOSPITAL datetime,
	OBITO_UCI tinyint,
	OBITO_HOSPITAL tinyint,
	VACINA int,

	foreign key (MOTIVO_ADMISSAO) references MOTIVO_ADMISSAO(ID_MOTIVO),
	foreign key (VACINA) references VACINA(ID_VACINA)
);

create table VMI (
	ID_EPISODIO int not null primary key,
	DATA_INICIO_VMI datetime,
	DATA_FIM_VMI datetime,

	foreign key (ID_EPISODIO) references EPISODIO(ID_EPISODIO)
);

create table ECMO (
	ID_EPISODIO int not null primary key,
	DATA_INICIO_ECMO datetime,
	DATA_FIM_ECMO datetime,
	
	foreign key (ID_EPISODIO) references EPISODIO(ID_EPISODIO)
);

create table COMORBIDADE (
	ID_EPISODIO int not null primary key,
	DELIRIO tinyint,
	COMORBILIDADES tinyint,
	HTA tinyint,
	CARDIOPATIA_ISQUEMICA tinyint,
	ICC tinyint,
	DIABETES tinyint,
	DPCO_ASMA_ENFISEMA tinyint,
	HIPERTENSAO_PULMONAR tinyint,
	INSUFICIENCIA_RENAL tinyint,
	HBP tinyint,
	DISLIPIDEMIA tinyint,
	HIPERURICEMIA tinyint,
	NEOPLASIA_SOLIDA tinyint,
	NEOPLASIA_HEMATOGICA tinyint,
	DEPRESSAO tinyint,
	AMILOIDOSE tinyint,
	ESCLEROSE_MULTIPLA tinyint,
	OBESIDADE tinyint,
	HIPOTIROIDISMO tinyint,
	SIDA tinyint,
	DISRRITMIA tinyint,
	DHC tinyint,
	AVC tinyint,
	TRANSPLANTADO tinyint,
	DOENCA_AUTOIMUNE tinyint,
	PARKINSON tinyint,
	EPILEPSIA tinyint,
	ESQUIZOFRENIA tinyint,
	
	foreign key (ID_EPISODIO) references EPISODIO(ID_EPISODIO)
);
