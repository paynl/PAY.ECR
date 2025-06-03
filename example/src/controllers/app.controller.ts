import {
    Controller,
    Get,
    Req,
    Render,
    Sse,
    MessageEvent,
    Session,
    HttpException,
    HttpStatus,
    Headers,
    Post, Param, Body
} from '@nestjs/common';
import {Session as FastifySession} from '@fastify/secure-session';
import {AppService} from '../services/app.service';
import { Observable, Subject} from "rxjs";
import * as crypto from "node:crypto";

interface PayNlSession {
    id: string;
}

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {
    }

    @Get()
    @Render('index.hbs')
    root() {
        return {};
    }

    @Get('init')
    init(@Session() session: FastifySession<PayNlSession>) {
        const id = crypto.randomUUID();
        session.set('id', id);
        return
    }

    @Sse('sse')
    sse(@Session() session: FastifySession<PayNlSession>): Observable<MessageEvent> {
        const sessionId = session.get('id');
        if (!sessionId) {
            console.warn('Empty sessionId');
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        const observable = new Subject<MessageEvent>();
        this.appService.registerSse(sessionId, observable);
        return observable;
    }

    @Get('saleLocations')
    async getSaleLocations() {
        const locations =  await this.appService.getSaleLocations();
        if (!locations) {
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        return locations;
    }

    @Get('discover')
    discoverTerminals(@Session() session: FastifySession<PayNlSession>) {
        const sessionId = session.get('id');
        if (!sessionId) {
            console.warn('Empty sessionId');
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        this.appService.discoverTerminals(sessionId);
        return;
    }

    @Get('connect/:ipAddress')
    async connect(@Session() session: FastifySession<PayNlSession>, @Param('ipAddress') ipAddress: string) {
        const sessionId = session.get('id');
        if (!sessionId) {
            console.warn('Empty sessionId');
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        this.appService.connectToTerminal(sessionId, ipAddress)
    }

    @Post('ping')
    async pingTerminal(@Session() session: FastifySession<PayNlSession>, @Headers() headers: Headers) {
        const sessionId = session.get('id');
        if (!sessionId) {
            console.warn('Empty sessionId');
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        await this.appService.pingDevice(sessionId, this.getAuthData(headers));
    }

    @Post('start-payment')
    async startPayment(@Session() session: FastifySession<PayNlSession>, @Body() body, @Headers() headers: Headers) {
        const sessionId = session.get('id');
        if (!sessionId) {
            console.warn('Empty sessionId');
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        await this.appService.startPayment(sessionId, body, this.getAuthData(headers));
    }

    @Post('stop-payment')
    async stopPayment(@Session() session: FastifySession<PayNlSession>, @Headers() headers: Headers) {
        const sessionId = session.get('id');
        if (!sessionId) {
            console.warn('Empty sessionId');
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        await this.appService.stopPayment(sessionId, this.getAuthData(headers));
    }

    @Post('list-history')
    async listHistory(@Session() session: FastifySession<PayNlSession>, @Headers() headers: Headers) {
        const sessionId = session.get('id');
        if (!sessionId) {
            console.warn('Empty sessionId');
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        await this.appService.listHistory(sessionId, this.getAuthData(headers));
    }

    @Post('get-history/:needle')
    async getHistory(@Session() session: FastifySession<PayNlSession>, @Param('needle') needle: string, @Headers() headers: Headers) {
        const sessionId = session.get('id');
        if (!sessionId) {
            console.warn('Empty sessionId');
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        await this.appService.getHistory(sessionId, needle, this.getAuthData(headers));
    }

    @Post('create-order')
    async createOrder(@Session() session: FastifySession<PayNlSession>, @Body() body, @Headers() headers: Headers) {
        const sessionId = session.get('id');
        if (!sessionId) {
            console.warn('Empty sessionId');
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        await this.appService.createOrder(sessionId, body, this.getAuthData(headers));
    }

    @Post('update-order')
    async updateOrder(@Session() session: FastifySession<PayNlSession>, @Body() body, @Headers() headers: Headers) {
        const sessionId = session.get('id');
        if (!sessionId) {
            console.warn('Empty sessionId');
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        await this.appService.updateOrder(sessionId, body, this.getAuthData(headers));
    }

    @Post('start-order')
    async startOrder(@Session() session: FastifySession<PayNlSession>, @Headers() headers: Headers) {
        const sessionId = session.get('id');
        if (!sessionId) {
            console.warn('Empty sessionId');
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        await this.appService.startOrder(sessionId, this.getAuthData(headers));
    }

    @Post('stop-order')
    async stopOrder(@Session() session: FastifySession<PayNlSession>, @Headers() headers: Headers) {
        const sessionId = session.get('id');
        if (!sessionId) {
            console.warn('Empty sessionId');
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        await this.appService.stopOrder(sessionId, this.getAuthData(headers));
    }

    private getAuthData(headers: Headers) {
        return {
            thCode: headers['x-terminal-code'],
            slCode: headers['x-sale-location-code']
        }
    }
}
