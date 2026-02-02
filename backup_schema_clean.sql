--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Budget; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Budget" (
    id text NOT NULL,
    "glAccountId" text NOT NULL,
    year integer NOT NULL,
    rkap double precision DEFAULT 0 NOT NULL,
    "releasePercent" double precision DEFAULT 100 NOT NULL,
    "totalAmount" double precision NOT NULL,
    "q1Amount" double precision DEFAULT 0 NOT NULL,
    "q2Amount" double precision DEFAULT 0 NOT NULL,
    "q3Amount" double precision DEFAULT 0 NOT NULL,
    "q4Amount" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "aprAmount" double precision DEFAULT 0 NOT NULL,
    "augAmount" double precision DEFAULT 0 NOT NULL,
    "decAmount" double precision DEFAULT 0 NOT NULL,
    "febAmount" double precision DEFAULT 0 NOT NULL,
    "janAmount" double precision DEFAULT 0 NOT NULL,
    "julAmount" double precision DEFAULT 0 NOT NULL,
    "junAmount" double precision DEFAULT 0 NOT NULL,
    "marAmount" double precision DEFAULT 0 NOT NULL,
    "mayAmount" double precision DEFAULT 0 NOT NULL,
    "novAmount" double precision DEFAULT 0 NOT NULL,
    "octAmount" double precision DEFAULT 0 NOT NULL,
    "sepAmount" double precision DEFAULT 0 NOT NULL
);


--
-- Name: GlAccount; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GlAccount" (
    id text NOT NULL,
    code text NOT NULL,
    description text NOT NULL,
    keterangan text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ImprestFund; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ImprestFund" (
    id text NOT NULL,
    "kelompokKegiatan" text NOT NULL,
    "regionalCode" text,
    status text DEFAULT 'draft'::text NOT NULL,
    "totalAmount" double precision DEFAULT 0 NOT NULL,
    debit double precision DEFAULT 0 NOT NULL,
    keterangan text,
    "imprestFundCardId" text,
    "noTiketMydx" text,
    "tglSerahFinance" timestamp(3) without time zone,
    "picFinance" text,
    "noHpFinance" text,
    "tglTransferVendor" timestamp(3) without time zone,
    "nilaiTransfer" double precision,
    "taskPengajuan" boolean DEFAULT true NOT NULL,
    "taskTransferVendor" boolean DEFAULT false NOT NULL,
    "taskTerimaBerkas" boolean DEFAULT false NOT NULL,
    "taskUploadMydx" boolean DEFAULT false NOT NULL,
    "taskSerahFinance" boolean DEFAULT false NOT NULL,
    "taskVendorDibayar" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ImprestFundCard; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ImprestFundCard" (
    id text NOT NULL,
    "nomorKartu" text NOT NULL,
    "user" text NOT NULL,
    saldo double precision DEFAULT 0 NOT NULL,
    pic text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ImprestItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ImprestItem" (
    id text NOT NULL,
    "imprestFundId" text NOT NULL,
    tanggal timestamp(3) without time zone NOT NULL,
    uraian text NOT NULL,
    "glAccountId" text NOT NULL,
    jumlah double precision NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: MonthlyAllocation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MonthlyAllocation" (
    id text NOT NULL,
    "glAccountId" text NOT NULL,
    year integer NOT NULL,
    "janAmount" double precision DEFAULT 0 NOT NULL,
    "febAmount" double precision DEFAULT 0 NOT NULL,
    "marAmount" double precision DEFAULT 0 NOT NULL,
    "aprAmount" double precision DEFAULT 0 NOT NULL,
    "mayAmount" double precision DEFAULT 0 NOT NULL,
    "junAmount" double precision DEFAULT 0 NOT NULL,
    "julAmount" double precision DEFAULT 0 NOT NULL,
    "augAmount" double precision DEFAULT 0 NOT NULL,
    "sepAmount" double precision DEFAULT 0 NOT NULL,
    "octAmount" double precision DEFAULT 0 NOT NULL,
    "novAmount" double precision DEFAULT 0 NOT NULL,
    "decAmount" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PicAnggaran; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PicAnggaran" (
    id text NOT NULL,
    unit text NOT NULL,
    "namaPemegangImprest" text NOT NULL,
    "nikPemegangImprest" text NOT NULL,
    "namaPenanggungJawab" text NOT NULL,
    "nikPenanggungJawab" text NOT NULL,
    year integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Regional; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Regional" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: RegionalAllocation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RegionalAllocation" (
    id text NOT NULL,
    "budgetId" text NOT NULL,
    "regionalCode" text NOT NULL,
    quarter integer NOT NULL,
    amount double precision NOT NULL,
    percentage double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Transaction" (
    id text NOT NULL,
    "glAccountId" text NOT NULL,
    quarter integer NOT NULL,
    "regionalCode" text NOT NULL,
    kegiatan text NOT NULL,
    "regionalPengguna" text NOT NULL,
    year integer NOT NULL,
    "tanggalKwitansi" timestamp(3) without time zone,
    "nilaiKwitansi" double precision DEFAULT 0 NOT NULL,
    "jenisPajak" text,
    "nilaiTanpaPPN" double precision DEFAULT 0 NOT NULL,
    "nilaiPPN" double precision DEFAULT 0 NOT NULL,
    keterangan text,
    "jenisPengadaan" text,
    "vendorId" text,
    "tanggalEntry" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "noTiketMydx" text,
    "tglSerahFinance" timestamp(3) without time zone,
    "picFinance" text,
    "noHpFinance" text,
    "tglTransferVendor" timestamp(3) without time zone,
    "nilaiTransfer" double precision,
    "taskPengajuan" boolean DEFAULT true NOT NULL,
    "taskTransferVendor" boolean DEFAULT false NOT NULL,
    "taskTerimaBerkas" boolean DEFAULT false NOT NULL,
    "taskUploadMydx" boolean DEFAULT false NOT NULL,
    "taskSerahFinance" boolean DEFAULT false NOT NULL,
    "taskVendorDibayar" boolean DEFAULT false NOT NULL,
    status text DEFAULT 'Open'::text NOT NULL,
    "imprestFundId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: TransactionFile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TransactionFile" (
    id text NOT NULL,
    "transactionId" text NOT NULL,
    "fileName" text NOT NULL,
    "originalName" text NOT NULL,
    "fileSize" integer NOT NULL,
    "mimeType" text NOT NULL,
    "filePath" text NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    avatar text DEFAULT '/avatar.png'::text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Vendor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Vendor" (
    id text NOT NULL,
    name text NOT NULL,
    alamat text,
    pic text,
    phone text,
    email text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Budget Budget_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_pkey" PRIMARY KEY (id);


--
-- Name: GlAccount GlAccount_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GlAccount"
    ADD CONSTRAINT "GlAccount_pkey" PRIMARY KEY (id);


--
-- Name: ImprestFundCard ImprestFundCard_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ImprestFundCard"
    ADD CONSTRAINT "ImprestFundCard_pkey" PRIMARY KEY (id);


--
-- Name: ImprestFund ImprestFund_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ImprestFund"
    ADD CONSTRAINT "ImprestFund_pkey" PRIMARY KEY (id);


--
-- Name: ImprestItem ImprestItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ImprestItem"
    ADD CONSTRAINT "ImprestItem_pkey" PRIMARY KEY (id);


--
-- Name: MonthlyAllocation MonthlyAllocation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MonthlyAllocation"
    ADD CONSTRAINT "MonthlyAllocation_pkey" PRIMARY KEY (id);


--
-- Name: PicAnggaran PicAnggaran_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PicAnggaran"
    ADD CONSTRAINT "PicAnggaran_pkey" PRIMARY KEY (id);


--
-- Name: RegionalAllocation RegionalAllocation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RegionalAllocation"
    ADD CONSTRAINT "RegionalAllocation_pkey" PRIMARY KEY (id);


--
-- Name: Regional Regional_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Regional"
    ADD CONSTRAINT "Regional_pkey" PRIMARY KEY (id);


--
-- Name: TransactionFile TransactionFile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TransactionFile"
    ADD CONSTRAINT "TransactionFile_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Vendor Vendor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Vendor"
    ADD CONSTRAINT "Vendor_pkey" PRIMARY KEY (id);


--
-- Name: Budget_glAccountId_year_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Budget_glAccountId_year_key" ON public."Budget" USING btree ("glAccountId", year);


--
-- Name: GlAccount_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "GlAccount_code_key" ON public."GlAccount" USING btree (code);


--
-- Name: ImprestFundCard_nomorKartu_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ImprestFundCard_nomorKartu_key" ON public."ImprestFundCard" USING btree ("nomorKartu");


--
-- Name: ImprestFund_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ImprestFund_createdAt_idx" ON public."ImprestFund" USING btree ("createdAt" DESC);


--
-- Name: ImprestFund_imprestFundCardId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ImprestFund_imprestFundCardId_idx" ON public."ImprestFund" USING btree ("imprestFundCardId");


--
-- Name: ImprestFund_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ImprestFund_status_idx" ON public."ImprestFund" USING btree (status);


--
-- Name: MonthlyAllocation_glAccountId_year_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "MonthlyAllocation_glAccountId_year_key" ON public."MonthlyAllocation" USING btree ("glAccountId", year);


--
-- Name: PicAnggaran_unit_year_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PicAnggaran_unit_year_key" ON public."PicAnggaran" USING btree (unit, year);


--
-- Name: RegionalAllocation_budgetId_regionalCode_quarter_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "RegionalAllocation_budgetId_regionalCode_quarter_key" ON public."RegionalAllocation" USING btree ("budgetId", "regionalCode", quarter);


--
-- Name: Regional_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Regional_code_key" ON public."Regional" USING btree (code);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Budget Budget_glAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_glAccountId_fkey" FOREIGN KEY ("glAccountId") REFERENCES public."GlAccount"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ImprestFund ImprestFund_imprestFundCardId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ImprestFund"
    ADD CONSTRAINT "ImprestFund_imprestFundCardId_fkey" FOREIGN KEY ("imprestFundCardId") REFERENCES public."ImprestFundCard"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ImprestItem ImprestItem_glAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ImprestItem"
    ADD CONSTRAINT "ImprestItem_glAccountId_fkey" FOREIGN KEY ("glAccountId") REFERENCES public."GlAccount"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ImprestItem ImprestItem_imprestFundId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ImprestItem"
    ADD CONSTRAINT "ImprestItem_imprestFundId_fkey" FOREIGN KEY ("imprestFundId") REFERENCES public."ImprestFund"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MonthlyAllocation MonthlyAllocation_glAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MonthlyAllocation"
    ADD CONSTRAINT "MonthlyAllocation_glAccountId_fkey" FOREIGN KEY ("glAccountId") REFERENCES public."GlAccount"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RegionalAllocation RegionalAllocation_budgetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RegionalAllocation"
    ADD CONSTRAINT "RegionalAllocation_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES public."Budget"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TransactionFile TransactionFile_transactionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TransactionFile"
    ADD CONSTRAINT "TransactionFile_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES public."Transaction"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Transaction Transaction_glAccountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_glAccountId_fkey" FOREIGN KEY ("glAccountId") REFERENCES public."GlAccount"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_imprestFundId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_imprestFundId_fkey" FOREIGN KEY ("imprestFundId") REFERENCES public."ImprestFund"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Transaction Transaction_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public."Vendor"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict 2KnyZDbWhNk8Nma2epYyIEKp7IjkY0PV6Fb1cNEnnqF7Vq3cLrMb8sM7hJp7AbI

