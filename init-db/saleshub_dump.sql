--
-- PostgreSQL database dump
--


-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-04-30 20:58:24

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16544)
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- TOC entry 6008 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 227 (class 1259 OID 17634)
-- Name: Locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Locations" (
    "Id" integer NOT NULL,
    "Name" text NOT NULL,
    "Address" text NOT NULL,
    "City" text NOT NULL,
    "Coordinates" public.geometry NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL
);




--
-- TOC entry 226 (class 1259 OID 17633)
-- Name: Locations_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--


CREATE SEQUENCE public."Locations_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 229 (class 1259 OID 17648)
-- Name: OfferCategories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OfferCategories" (
    "Id" integer NOT NULL,
    "Name" text NOT NULL,
    "IconUrl" text NOT NULL,
    "MarkerColor" text NOT NULL,
    "ParentId" integer,
    "CreatedAt" timestamp with time zone NOT NULL
);




--
-- TOC entry 228 (class 1259 OID 17647)
-- Name: OfferCategories_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--


CREATE SEQUENCE public."OfferCategories_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 239 (class 1259 OID 17745)
-- Name: OfferImages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OfferImages" (
    "Id" integer NOT NULL,
    "ImageUrl" text NOT NULL,
    "IsMain" boolean NOT NULL,
    "OfferId" integer NOT NULL
);




--
-- TOC entry 238 (class 1259 OID 17744)
-- Name: OfferImages_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--


CREATE SEQUENCE public."OfferImages_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 233 (class 1259 OID 17680)
-- Name: Offers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Offers" (
    "Id" integer NOT NULL,
    "Title" text NOT NULL,
    "Description" text NOT NULL,
    "IsActive" boolean NOT NULL,
    "NewPrice" numeric NOT NULL,
    "OldPrice" numeric,
    "ValidFrom" timestamp with time zone,
    "ValidTo" timestamp with time zone,
    "Creator" integer NOT NULL,
    "CategoryId" integer NOT NULL,
    "PlaceId" integer NOT NULL,
    "CreatedById" integer,
    "CreatedAt" timestamp with time zone NOT NULL
);




--
-- TOC entry 232 (class 1259 OID 17679)
-- Name: Offers_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--


CREATE SEQUENCE public."Offers_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 235 (class 1259 OID 17707)
-- Name: PlaceImages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PlaceImages" (
    "Id" integer NOT NULL,
    "ImageUrl" text NOT NULL,
    "IsMain" boolean NOT NULL,
    "PlaceId" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL
);




--
-- TOC entry 234 (class 1259 OID 17706)
-- Name: PlaceImages_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--


CREATE SEQUENCE public."PlaceImages_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 237 (class 1259 OID 17725)
-- Name: PlaceLocations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PlaceLocations" (
    "Id" integer NOT NULL,
    "PlaceId" integer NOT NULL,
    "LocationId" integer NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL
);




--
-- TOC entry 236 (class 1259 OID 17724)
-- Name: PlaceLocations_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--


CREATE SEQUENCE public."PlaceLocations_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 231 (class 1259 OID 17666)
-- Name: Places; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Places" (
    "Id" integer NOT NULL,
    "Name" text NOT NULL,
    "Description" text NOT NULL,
    "IsOnline" boolean NOT NULL,
    "OfferUrl" text NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL
);




--
-- TOC entry 230 (class 1259 OID 17665)
-- Name: Places_Id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--


CREATE SEQUENCE public."Places_Id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 225 (class 1259 OID 17626)
-- Name: __EFMigrationsHistory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL
);




--
-- TOC entry 5990 (class 0 OID 17634)
-- Dependencies: 227
-- Data for Name: Locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Locations" ("Id", "Name", "Address", "City", "Coordinates", "CreatedAt") FROM stdin;
1	Victoria Gardens	Kulparkivska St, 226A	Lviv	0101000020E610000043AD69DE71FA37408FC2F5285CE74840	2026-04-16 19:37:47.414287+03
2	Forum Lviv	Pid Dubom St, 7B	Lviv	0101000020E61000002F6EA301BC0538400612143FC6EC4840	2026-04-16 19:37:47.414287+03
3	Rynok Square	Rynok Square, 1	Lviv	0101000020E6100000F2D24D62100838404F401361C3EB4840	2026-04-16 19:37:47.414287+03
\.


--
-- TOC entry 5992 (class 0 OID 17648)
-- Dependencies: 229
-- Data for Name: OfferCategories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OfferCategories" ("Id", "Name", "IconUrl", "MarkerColor", "ParentId", "CreatedAt") FROM stdin;
1	Groceries	/icons/groceries.svg	#4CAF50	\N	2026-04-16 19:37:47.414287+03
2	Entertainment	/icons/movie.svg	#E91E63	\N	2026-04-16 19:37:47.414287+03
3	Fast Food	/icons/fastfood.svg	#FF9800	\N	2026-04-16 19:37:47.414287+03
4	Burgers	/icons/burger.svg	#FF9800	3	2026-04-16 19:37:47.414287+03
\.


--
-- TOC entry 6002 (class 0 OID 17745)
-- Dependencies: 239
-- Data for Name: OfferImages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OfferImages" ("Id", "ImageUrl", "IsMain", "OfferId") FROM stdin;
1	https://example.com/images/offers/popcorn_combo.jpg	t	1
2	https://example.com/images/offers/big_mac.jpg	t	2
3	https://example.com/images/offers/salmon_steak.jpg	t	3
\.


--
-- TOC entry 5996 (class 0 OID 17680)
-- Dependencies: 233
-- Data for Name: Offers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Offers" ("Id", "Title", "Description", "IsActive", "NewPrice", "OldPrice", "ValidFrom", "ValidTo", "Creator", "CategoryId", "PlaceId", "CreatedById", "CreatedAt") FROM stdin;
1	Weekend Cinema Ticket Combo	Get two movie tickets and a large popcorn for a discounted price.	t	350.00	500.00	2026-04-16 19:37:47.414287+03	2026-04-23 19:37:47.414287+03	1	2	2	1	2026-04-16 19:37:47.414287+03
2	Big Mac Menu -20%	Enjoy a classic Big Mac Menu with a 20% discount when ordering through the app.	t	160.00	200.00	2026-04-16 19:37:47.414287+03	2026-04-30 19:37:47.414287+03	1	4	3	1	2026-04-16 19:37:47.414287+03
3	Fresh Salmon Discount	Fresh Norwegian salmon steaks on sale this Friday only.	t	499.00	650.00	2026-04-16 19:37:47.414287+03	2026-04-18 19:37:47.414287+03	2	1	1	2	2026-04-16 19:37:47.414287+03
4	аавіф	аівфафів	t	123	346	2026-04-25 09:26:00+03	2026-04-30 09:26:00+03	1	2	3	\N	2026-04-24 09:26:26.785844+03
5	wallpaper	jfkdsla;fjkdsal;	t	123	345	2026-04-25 16:54:00+03	2026-05-01 16:54:00+03	1	2	3	\N	2026-04-24 16:54:43.836117+03
6	Mega offer	somethign	t	857	1200	2026-05-01 18:11:00+03	2026-05-07 18:11:00+03	1	3	3	\N	2026-04-24 18:12:08.576821+03
\.


--
-- TOC entry 5998 (class 0 OID 17707)
-- Dependencies: 235
-- Data for Name: PlaceImages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PlaceImages" ("Id", "ImageUrl", "IsMain", "PlaceId", "CreatedAt") FROM stdin;
1	https://example.com/images/silpo_main.jpg	t	1	2026-04-16 19:37:47.414287+03
2	https://example.com/images/multiplex_front.jpg	t	2	2026-04-16 19:37:47.414287+03
3	https://example.com/images/mcdonalds_exterior.jpg	t	3	2026-04-16 19:37:47.414287+03
\.


--
-- TOC entry 6000 (class 0 OID 17725)
-- Dependencies: 237
-- Data for Name: PlaceLocations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PlaceLocations" ("Id", "PlaceId", "LocationId", "CreatedAt") FROM stdin;
1	1	1	2026-04-16 19:37:47.414287+03
2	1	2	2026-04-16 19:37:47.414287+03
3	2	1	2026-04-16 19:37:47.414287+03
4	3	2	2026-04-16 19:37:47.414287+03
5	3	3	2026-04-16 19:37:47.414287+03
\.


--
-- TOC entry 5994 (class 0 OID 17666)
-- Dependencies: 231
-- Data for Name: Places; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Places" ("Id", "Name", "Description", "IsOnline", "OfferUrl", "CreatedAt") FROM stdin;
1	Silpo	Premium supermarket offering a wide variety of fresh food and daily necessities.	f	https://silpo.ua/offers	2026-04-16 19:37:47.414287+03
2	Multiplex	Modern cinema theater featuring the latest blockbusters and IMAX.	f	https://multiplex.ua/promotions	2026-04-16 19:37:47.414287+03
3	McDonald's	Classic fast food chain serving burgers, fries, and shakes.	f	https://mcdonalds.ua/app-deals	2026-04-16 19:37:47.414287+03
\.


--
-- TOC entry 5988 (class 0 OID 17626)
-- Dependencies: 225
-- Data for Name: __EFMigrationsHistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."__EFMigrationsHistory" ("MigrationId", "ProductVersion") FROM stdin;
20260413165119_InitialCreate	9.0.14
\.


--
-- TOC entry 5802 (class 0 OID 16863)
-- Dependencies: 221
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- TOC entry 6009 (class 0 OID 0)
-- Dependencies: 226
-- Name: Locations_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Locations_Id_seq"', 3, true);


--
-- TOC entry 6010 (class 0 OID 0)
-- Dependencies: 228
-- Name: OfferCategories_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."OfferCategories_Id_seq"', 4, true);


--
-- TOC entry 6011 (class 0 OID 0)
-- Dependencies: 238
-- Name: OfferImages_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."OfferImages_Id_seq"', 3, true);


--
-- TOC entry 6012 (class 0 OID 0)
-- Dependencies: 232
-- Name: Offers_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Offers_Id_seq"', 6, true);


--
-- TOC entry 6013 (class 0 OID 0)
-- Dependencies: 234
-- Name: PlaceImages_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PlaceImages_Id_seq"', 3, true);


--
-- TOC entry 6014 (class 0 OID 0)
-- Dependencies: 236
-- Name: PlaceLocations_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PlaceLocations_Id_seq"', 5, true);


--
-- TOC entry 6015 (class 0 OID 0)
-- Dependencies: 230
-- Name: Places_Id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Places_Id_seq"', 3, true);


--
-- TOC entry 5809 (class 2606 OID 17646)
-- Name: Locations PK_Locations; Type: CONSTRAINT; Schema: public; Owner: postgres
--


ALTER TABLE ONLY public."Locations"
    ADD CONSTRAINT "PK_Locations" PRIMARY KEY ("Id");


--
-- TOC entry 5812 (class 2606 OID 17659)
-- Name: OfferCategories PK_OfferCategories; Type: CONSTRAINT; Schema: public; Owner: postgres
--


ALTER TABLE ONLY public."OfferCategories"
    ADD CONSTRAINT "PK_OfferCategories" PRIMARY KEY ("Id");


--
-- TOC entry 5828 (class 2606 OID 17755)
-- Name: OfferImages PK_OfferImages; Type: CONSTRAINT; Schema: public; Owner: postgres
--


ALTER TABLE ONLY public."OfferImages"
    ADD CONSTRAINT "PK_OfferImages" PRIMARY KEY ("Id");


--
-- TOC entry 5818 (class 2606 OID 17695)
-- Name: Offers PK_Offers; Type: CONSTRAINT; Schema: public; Owner: postgres
--


ALTER TABLE ONLY public."Offers"
    ADD CONSTRAINT "PK_Offers" PRIMARY KEY ("Id");


--
-- TOC entry 5821 (class 2606 OID 17718)
-- Name: PlaceImages PK_PlaceImages; Type: CONSTRAINT; Schema: public; Owner: postgres
--


ALTER TABLE ONLY public."PlaceImages"
    ADD CONSTRAINT "PK_PlaceImages" PRIMARY KEY ("Id");


--
-- TOC entry 5825 (class 2606 OID 17733)
-- Name: PlaceLocations PK_PlaceLocations; Type: CONSTRAINT; Schema: public; Owner: postgres
--


ALTER TABLE ONLY public."PlaceLocations"
    ADD CONSTRAINT "PK_PlaceLocations" PRIMARY KEY ("Id");


--
-- TOC entry 5814 (class 2606 OID 17678)
-- Name: Places PK_Places; Type: CONSTRAINT; Schema: public; Owner: postgres
--


ALTER TABLE ONLY public."Places"
    ADD CONSTRAINT "PK_Places" PRIMARY KEY ("Id");


--
-- TOC entry 5807 (class 2606 OID 17632)
-- Name: __EFMigrationsHistory PK___EFMigrationsHistory; Type: CONSTRAINT; Schema: public; Owner: postgres
--


ALTER TABLE ONLY public."__EFMigrationsHistory"
    ADD CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId");


--
-- TOC entry 5810 (class 1259 OID 17761)
-- Name: IX_OfferCategories_ParentId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_OfferCategories_ParentId" ON public."OfferCategories" USING btree ("ParentId");


--
-- TOC entry 5826 (class 1259 OID 17762)
-- Name: IX_OfferImages_OfferId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_OfferImages_OfferId" ON public."OfferImages" USING btree ("OfferId");


--
-- TOC entry 5815 (class 1259 OID 17763)
-- Name: IX_Offers_CategoryId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_Offers_CategoryId" ON public."Offers" USING btree ("CategoryId");


--
-- TOC entry 5816 (class 1259 OID 17764)
-- Name: IX_Offers_PlaceId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_Offers_PlaceId" ON public."Offers" USING btree ("PlaceId");


--
-- TOC entry 5819 (class 1259 OID 17765)
-- Name: IX_PlaceImages_PlaceId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_PlaceImages_PlaceId" ON public."PlaceImages" USING btree ("PlaceId");


--
-- TOC entry 5822 (class 1259 OID 17766)
-- Name: IX_PlaceLocations_LocationId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_PlaceLocations_LocationId" ON public."PlaceLocations" USING btree ("LocationId");


--
-- TOC entry 5823 (class 1259 OID 17767)
-- Name: IX_PlaceLocations_PlaceId; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IX_PlaceLocations_PlaceId" ON public."PlaceLocations" USING btree ("PlaceId");


--
-- TOC entry 5829 (class 2606 OID 17660)
-- Name: OfferCategories FK_OfferCategories_OfferCategories_ParentId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--


ALTER TABLE ONLY public."OfferCategories"
    ADD CONSTRAINT "FK_OfferCategories_OfferCategories_ParentId" FOREIGN KEY ("ParentId") REFERENCES public."OfferCategories"("Id");


--
-- TOC entry 5835 (class 2606 OID 17756)
-- Name: OfferImages FK_OfferImages_Offers_OfferId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--


ALTER TABLE ONLY public."OfferImages"
    ADD CONSTRAINT "FK_OfferImages_Offers_OfferId" FOREIGN KEY ("OfferId") REFERENCES public."Offers"("Id") ON DELETE CASCADE;


--
-- TOC entry 5830 (class 2606 OID 17696)
-- Name: Offers FK_Offers_OfferCategories_CategoryId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--


ALTER TABLE ONLY public."Offers"
    ADD CONSTRAINT "FK_Offers_OfferCategories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES public."OfferCategories"("Id") ON DELETE CASCADE;


--
-- TOC entry 5831 (class 2606 OID 17701)
-- Name: Offers FK_Offers_Places_PlaceId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--


ALTER TABLE ONLY public."Offers"
    ADD CONSTRAINT "FK_Offers_Places_PlaceId" FOREIGN KEY ("PlaceId") REFERENCES public."Places"("Id") ON DELETE CASCADE;


--
-- TOC entry 5832 (class 2606 OID 17719)
-- Name: PlaceImages FK_PlaceImages_Places_PlaceId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--


ALTER TABLE ONLY public."PlaceImages"
    ADD CONSTRAINT "FK_PlaceImages_Places_PlaceId" FOREIGN KEY ("PlaceId") REFERENCES public."Places"("Id") ON DELETE CASCADE;


--
-- TOC entry 5833 (class 2606 OID 17734)
-- Name: PlaceLocations FK_PlaceLocations_Locations_LocationId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--


ALTER TABLE ONLY public."PlaceLocations"
    ADD CONSTRAINT "FK_PlaceLocations_Locations_LocationId" FOREIGN KEY ("LocationId") REFERENCES public."Locations"("Id") ON DELETE CASCADE;


--
-- TOC entry 5834 (class 2606 OID 17739)
-- Name: PlaceLocations FK_PlaceLocations_Places_PlaceId; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--


ALTER TABLE ONLY public."PlaceLocations"
    ADD CONSTRAINT "FK_PlaceLocations_Places_PlaceId" FOREIGN KEY ("PlaceId") REFERENCES public."Places"("Id") ON DELETE CASCADE;


-- Completed on 2026-04-30 20:58:58
--
-- PostgreSQL database dump complete
--

