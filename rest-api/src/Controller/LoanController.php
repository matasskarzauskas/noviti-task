<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use App\Service\LoanCalculatorService;

#[Route('/api', name: 'api_')]
class LoanController extends AbstractController
{
    #[Route('/loan/generate', name: 'app_noviti', methods: ['POST'])]
    public function index(Request $request): JsonResponse
    {
        $parameters = json_decode($request->getContent(), true);

        if ($response = $this->validateRequest($parameters)) {
            return $response;
        }

        $loanCalculator = new LoanCalculatorService(
            $parameters['amount'],
            $parameters['duration'],
            $parameters['interestRate']
        );
        $loanCalculator->calculate();

        // Imitating API delay
        sleep(1);

        return $this->json([
            'message' => [
                'monthlyEntries' => $loanCalculator->getMonthlyEntries(),
                'totals' => $loanCalculator->getTotals()
            ]
        ]);
    }

    private function validateRequest(array $parameters): ?JsonResponse
    {
        if (empty($parameters['interestRate']))
        {
            return $this->json([
                'message' => 'Interest rate is required',
            ], Response::HTTP_BAD_REQUEST);
        } else if (!is_float($parameters['interestRate'])) {
            return $this->json([
                'message' => 'Interest rate must be a float value',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (empty($parameters['amount']))
        {
            return $this->json([
                'message' => 'Amount is required',
            ], Response::HTTP_BAD_REQUEST);
        } else if (!is_numeric($parameters['amount'])) {
            return $this->json([
                'message' => 'Amount must be a number',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (empty($parameters['duration']))
        {
            return $this->json([
                'message' => 'Duration is required',
            ], Response::HTTP_BAD_REQUEST);
        } else if (!is_int($parameters['duration'])) {
            return $this->json([
                'message' => 'Duration must be an integer value',
            ], Response::HTTP_BAD_REQUEST);
        }

        return null;
    }


}
