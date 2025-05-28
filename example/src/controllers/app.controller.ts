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
    async pingTerminal(@Session() session: FastifySession<PayNlSession>) {
        const sessionId = session.get('id');
        if (!sessionId) {
            console.warn('Empty sessionId');
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        await this.appService.pingDevice(sessionId);
    }

    @Post('start-payment')
    async startPayment(@Session() session: FastifySession<PayNlSession>, @Body() body) {
        const sessionId = session.get('id');
        if (!sessionId) {
            console.warn('Empty sessionId');
            throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
        }

        await this.appService.startPayment(sessionId, body);
    }
}
